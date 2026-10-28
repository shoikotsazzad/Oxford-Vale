import { deleteModel, model, models, type Model, type Schema } from "mongoose";

/**
 * Compile a model once in production. In development this module re-runs on hot reload with the
 * edited schema, so the old model is replaced; reusing it would silently drop newly added fields.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineModel<T>(name: string, schema: Schema<any>): Model<T> {
  if (models[name]) {
    if (process.env.NODE_ENV === "production") return models[name] as Model<T>;
    deleteModel(name);
  }
  return model(name, schema) as unknown as Model<T>;
}
