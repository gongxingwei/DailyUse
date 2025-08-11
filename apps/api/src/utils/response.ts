import type { Response } from 'express';
import type { TResponse } from '../types';

export const ok = <T>(res: Response, data?: T, message = 'ok') => {
  const body: TResponse<T> = { success: true, message, data };
  return res.json(body);
};

export const created = <T>(res: Response, data?: T, message = 'created') => {
  const body: TResponse<T> = { success: true, message, data };
  return res.status(201).json(body);
};

export const badRequest = (res: Response, message = 'bad request') => {
  const body: TResponse = { success: false, message };
  return res.status(400).json(body);
};

export const unauthorized = (res: Response, message = 'unauthorized') => {
  const body: TResponse = { success: false, message };
  return res.status(401).json(body);
};

export const forbidden = (res: Response, message = 'forbidden') => {
  const body: TResponse = { success: false, message };
  return res.status(403).json(body);
};

export const notFound = (res: Response, message = 'not found') => {
  const body: TResponse = { success: false, message };
  return res.status(404).json(body);
};

export const error = (res: Response, message = 'internal error', status = 500) => {
  const body: TResponse = { success: false, message };
  return res.status(status).json(body);
};
