// Design System Kit - Naming Utilities
export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export interface NamingConfig {
  prefix: string;
  caseConvention: 'pascal' | 'kebab' | 'snake' | 'camel';
  separator: string;
}

export const DEFAULT_NAMING: NamingConfig = {
  prefix: 'DS',
  caseConvention: 'pascal',
  separator: '/',
};

export function formatComponentName(
  category: string,
  name: string,
  variant?: string,
  state?: string,
  size?: string,
  naming: NamingConfig = DEFAULT_NAMING
): string {
  const parts = [naming.prefix, category, name];
  if (variant) parts.push(variant);
  if (state) parts.push(state);
  if (size) parts.push(size);

  const formatted = parts.map(p => {
    switch (naming.caseConvention) {
      case 'pascal': return toPascalCase(p);
      case 'kebab': return toKebabCase(p);
      case 'snake': return toSnakeCase(p);
      case 'camel': return toCamelCase(p);
    }
  });

  return formatted.join(naming.separator);
}

export function formatStyleName(
  category: string,
  name: string,
  variant?: string,
  naming: NamingConfig = DEFAULT_NAMING
): string {
  const parts = [category, name];
  if (variant) parts.push(variant);

  const formatted = parts.map(p => {
    switch (naming.caseConvention) {
      case 'pascal': return toPascalCase(p);
      case 'kebab': return toKebabCase(p);
      case 'snake': return toSnakeCase(p);
      case 'camel': return toCamelCase(p);
    }
  });

  return formatted.join(naming.separator);
}

export function formatTokenName(
  category: string,
  name: string,
  variant?: string,
  naming: NamingConfig = DEFAULT_NAMING
): string {
  return formatStyleName(category, name, variant, naming);
}