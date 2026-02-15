export type ApiValidationError = {
  status?: number;
  message?: string;
  errors?: { field?: string; error?: string }[];
};

function translateMessage(msg?: string): string | undefined {
  if (!msg) return msg;

  const map: Record<string, string> = {
    'Subscription not expired yet': 'A subscrição ainda não expirou',
    'Validation error': 'Erro de validação',
    'Invalid email': 'Email inválido',
    'Invalid URL (use https)': 'URL inválida (use https)',
    'Required field': 'Campo obrigatório'
  };

  return map[msg] ?? msg; // se não achar, retorna original
}

export function fieldLabel(field?: string): string {
  switch (field) {
    case 'email': return 'Email';
    case 'companyWebsiteUrl': return 'Endereço do Site';
    case 'fullName': return 'Nome Completo';
    case 'passwordHash': return 'Senha';
    case 'phoneNumber': return 'Telefone';
    default: return field ?? 'Campo';
  }
}

export async function parseApiError(res: Response, fallback: string): Promise<Error> {
  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const data = (await res.json()) as ApiValidationError;

      const translatedMessage = translateMessage(data?.message) ?? fallback;

      // se vier lista de erros por campo
      if (data?.errors?.length) {
        const details = data.errors
          .map(e => `• ${fieldLabel(e.field)}: ${translateMessage(e.error) ?? e.error ?? 'inválido'}`)
          .join('\n');

        return new Error(`${translatedMessage}\n${details}`);
      }

      // se vier só message (seu caso)
      if (data?.message) {
        return new Error(translatedMessage);
      }
    } catch {
      // fallback abaixo
    }
  }

  try {
    const text = await res.text();
    if (text?.trim()) return new Error(text);
  } catch {}

  return new Error(`${fallback}: HTTP ${res.status}`);
}