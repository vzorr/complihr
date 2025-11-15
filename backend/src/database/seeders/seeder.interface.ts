export interface Seeder {
  seed(): Promise<void>;
  clear(): Promise<void>;
}
