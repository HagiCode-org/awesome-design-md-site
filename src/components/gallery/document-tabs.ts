interface DocumentTabLabels {
  copyDesign: string;
  copiedText: string;
  copyFailedText: string;
}

function setActionVisibility(element: HTMLElement | null, visible: boolean) {
  if (!element) {
    return;
  }

  element.classList.toggle('is-visible', visible);
  element.setAttribute('aria-hidden', visible ? 'false' : 'true');

  if (element instanceof HTMLAnchorElement) {
    element.tabIndex = visible ? 0 : -1;
  }
}

export function initializeDocumentTabs(rootDocument: Document = document) {
  rootDocument.querySelectorAll<HTMLElement>('[data-document-tabs]').forEach((root) => {
    const labels: DocumentTabLabels = {
      copyDesign: root.dataset.copyDesignLabel ?? 'Copy DESIGN.md',
      copiedText: root.dataset.copiedLabel ?? 'Copied',
      copyFailedText: root.dataset.copyFailedLabel ?? 'Copy failed',
    };
    const tabs = Array.from(root.querySelectorAll<HTMLElement>('[data-doc-tab]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-doc-panel]'));
    const copyButton = root.querySelector<HTMLButtonElement>('[data-copy-design]');
    const downloadLink = root.querySelector<HTMLAnchorElement>('[data-download-design]');
    const designMarkdown = root.querySelector<HTMLTextAreaElement>('[data-design-markdown]');

    const activate = (target: string) => {
      tabs.forEach((tab) => {
        const active = tab.getAttribute('data-doc-tab') === target;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const active = panel.getAttribute('data-doc-panel') === target;
        panel.classList.toggle('is-active', active);
        panel.toggleAttribute('hidden', !active);
      });

      const designActive = target === 'design';

      if (copyButton) {
        copyButton.disabled = !designActive;
        copyButton.setAttribute('aria-disabled', designActive ? 'false' : 'true');
        copyButton.textContent = labels.copyDesign;
        setActionVisibility(copyButton, designActive);
      }

      setActionVisibility(downloadLink, designActive);
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        activate(tab.getAttribute('data-doc-tab') || 'readme');
      });
    });

    if (copyButton && designMarkdown) {
      copyButton.addEventListener('click', async () => {
        if (copyButton.disabled) {
          return;
        }

        try {
          await navigator.clipboard.writeText(designMarkdown.value);
          copyButton.textContent = labels.copiedText;
        } catch {
          copyButton.textContent = labels.copyFailedText;
        }
      });
    }

    activate('readme');
  });
}
