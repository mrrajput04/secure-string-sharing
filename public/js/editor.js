class SecureEditor {
  constructor(elementId) {
    this.editor = new SimpleMDE({
      element: document.getElementById(elementId),
      autofocus: true,
      spellChecker: true,
      toolbar: [
        'bold', 'italic', 'heading', '|',
        'quote', 'unordered-list', 'ordered-list', '|',
        'link', 'image', '|',
        'preview', 'side-by-side', 'fullscreen', '|',
        'guide'
      ]
    });

    this.setupThemeSelector();
  }

  setupThemeSelector() {
    const themes = ['light', 'dark', 'ocean', 'forest'];
    const selector = document.createElement('select');
    selector.id = 'theme-selector';

    themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme;
      option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
      selector.appendChild(option);
    });

    selector.addEventListener('change', (e) => {
      document.documentElement.setAttribute('data-theme', e.target.value);
      localStorage.setItem('preferred-theme', e.target.value);
    });

    document.querySelector('.editor-toolbar').appendChild(selector);
  }

  getContent(format = 'markdown') {
    const content = this.editor.value();
    return format === 'html' ? marked(content) : content;
  }

  setContent(content) {
    this.editor.value(content);
  }
}