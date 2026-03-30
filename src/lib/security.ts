export function sanitizeUserInput(input: string): string {
  if (!input) return "";
  
  // Remove potential prompt injection patterns
  const dangerous = [
    'ignore previous instructions',
    'ignore above',
    'system prompt',
    'you are now',
    'new instructions',
    'disregard',
    'override',
  ];
  
  let sanitized = input;
  dangerous.forEach(pattern => {
    sanitized = sanitized.replace(new RegExp(pattern, 'gi'), '[FILTERED]');
  });
  
  // Truncate to prevent token stuffing
  return sanitized.slice(0, 500);
}
