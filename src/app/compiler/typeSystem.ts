export type ValueType =
  | { kind: 'i32' }
  | { kind: 'bool' }
  | { kind: 'f64' }
  | { kind: 'unit' }
  | { kind: 'unknown' }
  | { kind: 'never' }
  | { kind: 'ref'; mutable: boolean; to: ValueType }
  | { kind: 'array'; element: ValueType; length: number }
  | { kind: 'tuple'; elements: ValueType[] };

export const I32_TYPE: ValueType = { kind: 'i32' };
export const BOOL_TYPE: ValueType = { kind: 'bool' };
export const F64_TYPE: ValueType = { kind: 'f64' };
export const UNIT_TYPE: ValueType = { kind: 'unit' };
export const UNKNOWN_TYPE: ValueType = { kind: 'unknown' };
export const NEVER_TYPE: ValueType = { kind: 'never' };

export function typeToString(type: ValueType | undefined): string {
  if (!type) return '(none)';
  switch (type.kind) {
    case 'i32':
      return 'i32';
    case 'bool':
      return 'bool';
    case 'f64':
      return 'f64';
    case 'unit':
      return '()';
    case 'unknown':
      return '(infer)';
    case 'never':
      return '!';
    case 'ref':
      return type.mutable ? `&mut ${typeToString(type.to)}` : `&${typeToString(type.to)}`;
    case 'array':
      return `[${typeToString(type.element)}; ${type.length}]`;
    case 'tuple':
      return `(${type.elements.map(typeToString).join(',')}${type.elements.length === 1 ? ',' : ''})`;
    default:
      return '(unknown)';
  }
}

export function sameType(left: ValueType, right: ValueType): boolean {
  if (left.kind === 'unknown' || right.kind === 'unknown') return true;
  if (left.kind === 'never' || right.kind === 'never') return true;
  if (left.kind === 'unit' && right.kind === 'tuple' && right.elements.length === 0) return true;
  if (right.kind === 'unit' && left.kind === 'tuple' && left.elements.length === 0) return true;
  if (left.kind !== right.kind) return false;

  switch (left.kind) {
    case 'ref':
      return right.kind === 'ref' && left.mutable === right.mutable && sameType(left.to, right.to);
    case 'array':
      return right.kind === 'array' && left.length === right.length && sameType(left.element, right.element);
    case 'tuple':
      return (
        right.kind === 'tuple' &&
        left.elements.length === right.elements.length &&
        left.elements.every((element, index) => sameType(element, right.elements[index]))
      );
    default:
      return true;
  }
}

export function isNumeric(type: ValueType): boolean {
  return type.kind === 'i32' || type.kind === 'f64' || type.kind === 'unknown' || type.kind === 'never';
}

export function isInteger(type: ValueType): boolean {
  return type.kind === 'i32' || type.kind === 'unknown' || type.kind === 'never';
}

export function isUnit(type: ValueType): boolean {
  return type.kind === 'unit' || (type.kind === 'tuple' && type.elements.length === 0);
}
