declare module "mongoose" {
  interface Query<ResultType, DocType extends Document<ResultType>, QueryHelpers = {}> {
    cache(): Promise<DocType | null>;
    saveFromCache(): Promise<DocType | null>;
  }
}
