export type CapturedElement = {
  kind:
    | 'button'
    | 'link'
    | 'input'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'table'
    | 'dialog'
    | 'other';
  tag: string;
  role?: string;
  name?: string;
  id?: string;
  testId?: string;
  ariaLabel?: string;
  placeholder?: string;
  inputType?: string;
  text?: string;
  href?: string;
  tableHeaders?: string[];
};

export type PageSnapshot = {
  url: string;
  title?: string;
  headers: string[];
  elements: CapturedElement[];
};

// Runs inside the browser page context.
export function pageSnapshotScript() {
  const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

  const headers = Array.from(document.querySelectorAll('h1, h2'))
    .map((h) => textOf(h))
    .filter(Boolean)
    .slice(0, 8);

  const getTestId = (el: Element) =>
    el.getAttribute('data-testid') || el.getAttribute('data-test-id') || el.getAttribute('data-test');

  const byInteractive = Array.from(
    document.querySelectorAll(
      [
        'button',
        'a[href]',
        'input',
        'textarea',
        'select',
        '[role="button"]',
        '[role="link"]',
        '[role="checkbox"]',
        '[role="radio"]',
        '[role="dialog"]',
        'dialog',
        '[aria-modal="true"]',
        'table',
      ].join(','),
    ),
  );

  const elements = byInteractive
    .map((el) => {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || undefined;
      const id = el.getAttribute('id') || undefined;
      const name = (el as any).name || el.getAttribute('name') || undefined;
      const ariaLabel = el.getAttribute('aria-label') || undefined;
      const placeholder = (el as any).placeholder || el.getAttribute('placeholder') || undefined;
      const testId = getTestId(el) || undefined;

      const href = tag === 'a' ? (el as HTMLAnchorElement).href : undefined;
      const inputType = tag === 'input' ? ((el as HTMLInputElement).type || 'text') : undefined;

      let kind: any = 'other';
      if (tag === 'button' || role === 'button') kind = 'button';
      else if (tag === 'a' || role === 'link') kind = 'link';
      else if (tag === 'textarea') kind = 'textarea';
      else if (tag === 'select') kind = 'select';
      else if (tag === 'input' && inputType === 'checkbox') kind = 'checkbox';
      else if (tag === 'input' && inputType === 'radio') kind = 'radio';
      else if (tag === 'input') kind = 'input';
      else if (tag === 'table') kind = 'table';
      else if (tag === 'dialog' || role === 'dialog') kind = 'dialog';

      const text = textOf(el);

      let tableHeaders: string[] | undefined;
      if (kind === 'table') {
        const ths = Array.from(el.querySelectorAll('th'))
          .map((th) => textOf(th))
          .filter(Boolean)
          .slice(0, 24);
        if (ths.length) tableHeaders = ths;
      }

      return {
        kind,
        tag,
        role,
        id,
        name,
        testId,
        ariaLabel,
        placeholder,
        inputType,
        text: text || undefined,
        href,
        tableHeaders,
      };
    })
    // remove duplicates by a simple key
    .filter(Boolean);

  const uniq = new Map<string, any>();
  for (const e of elements) {
    const key = [e.kind, e.testId, e.role, e.id, e.name, e.ariaLabel, e.text, e.href].filter(Boolean).join('|');
    if (!uniq.has(key)) uniq.set(key, e);
  }

  return {
    url: location.href,
    title: document.title,
    headers,
    elements: Array.from(uniq.values()).slice(0, 250),
  };
}
