// Scripts globais podem ser adicionados aqui conforme necessário.

document.addEventListener('DOMContentLoaded', () => {
  const copyTextToClipboard = async (texto) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto);
      return;
    }

    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = texto;
    tempTextarea.style.position = 'fixed';
    tempTextarea.style.opacity = '0';
    tempTextarea.style.pointerEvents = 'none';
    document.body.appendChild(tempTextarea);
    tempTextarea.focus();
    tempTextarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(tempTextarea);

    if (!successful) {
      throw new Error('Copy command was unsuccessful');
    }
  };

  document.querySelectorAll('.copy-declaracao').forEach((button) => {
    const originalLabel = button.textContent;
    button.addEventListener('click', async () => {
      const targetId = button.dataset.copyTarget;
      if (!targetId) return;

      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      const texto = targetElement.innerText.trim();
      if (!texto) return;

      try {
        await copyTextToClipboard(texto);
        button.textContent = 'Copiado!';
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-success');
      } catch (error) {
        button.textContent = 'Não foi possível copiar';
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-warning');
      }

      setTimeout(() => {
        button.textContent = originalLabel;
        button.classList.remove('btn-success', 'btn-warning');
        if (!button.classList.contains('btn-outline-primary')) {
          button.classList.add('btn-outline-primary');
        }
      }, 2000);
    });
  });
});
