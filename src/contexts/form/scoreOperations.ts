
// Helper function to clean score ranges and prevent circular references
export const cleanScoreRanges = (ranges: any): any[] => {
  if (!Array.isArray(ranges)) {
    return [];
  }
  
  return ranges.map(range => {
    if (!range || typeof range !== 'object') {
      return null;
    }
    
    return {
      min: typeof range.min === 'number' ? range.min : 0,
      max: typeof range.max === 'number' ? range.max : 0,
      message: typeof range.message === 'string' ? range.message : ''
    };
  }).filter(range => range !== null);
};

export const validateScoreRanges = (ranges: any[]): boolean => {
  return ranges.every(range => 
    range && 
    typeof range.min === 'number' && 
    typeof range.max === 'number' && 
    typeof range.message === 'string' &&
    range.min <= range.max
  );
};
