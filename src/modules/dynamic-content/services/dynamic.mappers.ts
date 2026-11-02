import {
  ModuleSeverity,
  ModuleStatus,
  SectionVariant,
  type Category,
  type ContentModule,
  type MediaAsset,
  type ModuleSummary,
  type Page,
  type Section,
} from 'modules/dynamic-content/types/dynamic.types';
import { parseBlockRows, type RawBlockRow } from './blocks.schema';

/**
 * ===========================================================================
 * MAPEO DE FILAS A TIPOS
 * ===========================================================================
 * Postgres usa `snake_case` y la aplicación `camelCase`. La traducción vive
 * aquí y solo aquí: ningún componente debería ver nunca un `icon_name`.
 *
 * Los `status` y `severity` también se traducen. En la base `coming_soon` va
 * en snake_case porque es un valor SQL con su CHECK; en la aplicación es
 * `comingSoon`, que es el valor que ya usa el módulo de contenido existente.
 * Sin esta traducción tendríamos dos grafías del mismo estado circulando.
 * ===========================================================================
 */

// ---------------------------------------------------------------------------
// Enumeraciones
// ---------------------------------------------------------------------------

const STATUS_FROM_DB: Record<string, ModuleStatus> = {
  draft: ModuleStatus.Draft,
  published: ModuleStatus.Published,
  coming_soon: ModuleStatus.ComingSoon,
};

const STATUS_TO_DB: Record<ModuleStatus, string> = {
  [ModuleStatus.Draft]: 'draft',
  [ModuleStatus.Published]: 'published',
  [ModuleStatus.ComingSoon]: 'coming_soon',
};

const SEVERITY_FROM_DB: Record<string, ModuleSeverity> = {
  critical: ModuleSeverity.Critical,
  urgent: ModuleSeverity.Urgent,
  basic: ModuleSeverity.Basic,
};

const VARIANT_FROM_DB: Record<string, SectionVariant> = {
  plain: SectionVariant.Plain,
  card: SectionVariant.Card,
  tinted: SectionVariant.Tinted,
};

export const statusToDb = (status: ModuleStatus): string => STATUS_TO_DB[status];

// ---------------------------------------------------------------------------
// Filas tal como llegan de PostgREST
// ---------------------------------------------------------------------------

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  icon_name: string;
  position: number;
}

export interface SectionRow {
  id: string;
  page_id: string;
  title: string | null;
  variant: string;
  position: number;
  created_at: string;
  updated_at: string;
  blocks?: RawBlockRow[] | null;
}

export interface PageRow {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  is_home: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  sections?: SectionRow[] | null;
}

export interface ModuleRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  icon_name: string;
  category_id: string | null;
  severity: string;
  status: string;
  tags: string[] | null;
  estimated_minutes: number;
  position: number;
  schema_version: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  category?: CategoryRow | null;
  pages?: PageRow[] | null;
}

export interface MediaRow {
  id: string;
  bucket: string;
  path: string;
  public_url: string;
  mime_type: string;
  bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  module_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mapeadores
// ---------------------------------------------------------------------------

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

export const mapCategory = (row: CategoryRow): Category => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  iconName: row.icon_name,
  position: row.position,
});

export const mapSection = (row: SectionRow): Section => ({
  id: row.id,
  pageId: row.page_id,
  title: row.title,
  // Una variante desconocida cae en `plain` en lugar de reventar: el contenido
  // de la sección importa más que su fondo.
  variant: VARIANT_FROM_DB[row.variant] ?? SectionVariant.Plain,
  position: row.position,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  // `parseBlockRows` valida y descarta los bloques corruptos, además de
  // ordenarlos. Es el único camino por el que entran bloques a la aplicación.
  blocks: parseBlockRows(row.blocks ?? []),
});

export const mapPage = (row: PageRow): Page => ({
  id: row.id,
  moduleId: row.module_id,
  slug: row.slug,
  title: row.title,
  subtitle: row.subtitle,
  isHome: row.is_home,
  position: row.position,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  sections: (row.sections ?? []).map(mapSection).sort(byPosition),
});

/**
 * El módulo sin su contenido. Es lo que pinta el catálogo: traer páginas,
 * secciones y bloques de treinta módulos para dibujar treinta tarjetas sería
 * descargar la base entera.
 */
export const mapModuleSummary = (row: ModuleRow): ModuleSummary => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  iconName: row.icon_name,
  categoryId: row.category_id,
  category: row.category ? mapCategory(row.category) : null,
  severity: SEVERITY_FROM_DB[row.severity] ?? ModuleSeverity.Basic,
  status: STATUS_FROM_DB[row.status] ?? ModuleStatus.Draft,
  tags: row.tags ?? [],
  estimatedMinutes: row.estimated_minutes,
  position: row.position,
  schemaVersion: row.schema_version,
  authorId: row.author_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapModule = (row: ModuleRow): ContentModule => ({
  ...mapModuleSummary(row),
  pages: (row.pages ?? []).map(mapPage).sort(byPosition),
});

export const mapMedia = (row: MediaRow): MediaAsset => ({
  id: row.id,
  bucket: row.bucket,
  path: row.path,
  publicUrl: row.public_url,
  mimeType: row.mime_type,
  bytes: row.bytes,
  width: row.width,
  height: row.height,
  alt: row.alt,
  moduleId: row.module_id,
  createdAt: row.created_at,
});

/**
 * Columnas del módulo con su contenido completo, en una sola consulta.
 *
 * El orden de los hijos NO se pide aquí sino que se aplica al mapear: PostgREST
 * permite ordenar tablas embebidas, pero hacerlo en el mapeador garantiza el
 * orden también cuando las filas llegan por otro camino.
 */
export const MODULE_WITH_CONTENT_SELECT = `
  *,
  category:categories(*),
  pages (
    *,
    sections (
      *,
      blocks (*)
    )
  )
`;

/** Columnas del catálogo: módulo y categoría, sin contenido. */
export const MODULE_SUMMARY_SELECT = '*, category:categories(*)';
