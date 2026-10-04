import express, { Request, Response } from 'express';
import multer from 'multer';
import { compareDimensionItems } from '../analytics/engine';
import { DatasetValidationError } from '../data/processor';
import { getSampleDatasets } from '../data/sampleData';
import { datasetRepository } from '../models/repository';
import { DimensionType, MetricType } from '../schemas/analytics';
import {
  answerAnalystQuestion,
  ingestUploadedBuffer,
  loadSampleDatasetById,
} from '../services/datasetService';

export const apiRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

apiRouter.get('/datasets', async (_req: Request, res: Response) => {
  try {
    const datasets = await datasetRepository.listAll();
    const active = await datasetRepository.getActive();
    const samples = getSampleDatasets().map((s) => ({
      id: s.id,
      name: s.name,
      filename: s.filename,
      description: s.description,
      rowCount: s.rows.length,
    }));
    res.json({
      datasets,
      activeDatasetId: active?.datasetId ?? null,
      samples,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to list datasets',
    });
  }
});

apiRouter.get('/datasets/active', async (_req: Request, res: Response) => {
  try {
    const active = await datasetRepository.getActive();
    res.json({ bundle: active });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch active dataset',
    });
  }
});

apiRouter.post(
  '/datasets/upload',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File size exceeds the maximum allowed limit of 10 MB.',
          });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: 'Failed to process uploaded file.' });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided in the upload request.' });
      }
      const bundle = await ingestUploadedBuffer(req.file.buffer, req.file.originalname);
      res.json({ bundle });
    } catch (err) {
      if (err instanceof DatasetValidationError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Unexpected error processing dataset.',
      });
    }
  }
);

apiRouter.post('/datasets/sample', async (req: Request, res: Response) => {
  try {
    const sampleId = req.body?.sampleId || 'sample-enterprise';
    const bundle = await loadSampleDatasetById(sampleId);
    res.json({ bundle });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to load sample dataset.',
    });
  }
});

apiRouter.post('/datasets/:id/activate', async (req: Request, res: Response) => {
  try {
    const bundle = await datasetRepository.setActive(req.params.id);
    if (!bundle) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }
    res.json({ bundle });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to switch active dataset.',
    });
  }
});

apiRouter.delete('/datasets/:id', async (req: Request, res: Response) => {
  try {
    await datasetRepository.deleteById(req.params.id);
    const active = await datasetRepository.getActive();
    const datasets = await datasetRepository.listAll();
    res.json({ bundle: active, datasets });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to delete dataset.',
    });
  }
});

apiRouter.post('/chat/ask', async (req: Request, res: Response) => {
  try {
    const { question, datasetId } = req.body || {};
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Please provide a non-empty question.' });
    }
    const response = await answerAnalystQuestion(question, datasetId);
    res.json(response);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Failed to answer question.',
    });
  }
});

apiRouter.post('/analytics/compare', async (req: Request, res: Response) => {
  try {
    const { dimension, metric, itemA, itemB, datasetId } = req.body || {};
    const bundle = datasetId
      ? await datasetRepository.getById(datasetId)
      : await datasetRepository.getActive();
    if (!bundle) {
      return res.status(400).json({ error: 'No active dataset loaded.' });
    }

    const dim: DimensionType = dimension || 'region';
    const met: MetricType = metric || 'revenue';
    if ((met === 'profit' || met === 'cost' || met === 'profit_margin') && bundle.quality.capabilities.cost.status === 'Unavailable') {
      return res.status(400).json({
        error: 'Profit cannot be calculated because the dataset does not contain Cost information.',
      });
    }

    const rows =
      dim === 'product'
        ? bundle.productAnalysis
        : dim === 'category'
        ? bundle.categoryAnalysis
        : bundle.regionalAnalysis;

    const result = compareDimensionItems(
      rows,
      dim,
      met,
      String(itemA || ''),
      String(itemB || ''),
      bundle.kpis.currencySymbol
    );

    if (!result) {
      return res.status(404).json({
        error: `Could not compare "${itemA}" and "${itemB}" in ${dim}.`,
      });
    }

    res.json({ comparison: result });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to run comparison.',
    });
  }
});
