(() => {
	const buttons = document.querySelectorAll('.tab-btn[data-tab]');
	const panels = document.querySelectorAll('.tab-content[data-tab-panel]');

	function activateTab(tabId) {
		buttons.forEach((button) => {
			const isActive = button.dataset.tab === tabId;
			button.classList.toggle('active', isActive);
			button.setAttribute('aria-selected', String(isActive));
		});

		panels.forEach((panel) => {
			panel.hidden = panel.dataset.tabPanel !== tabId;
			panel.classList.toggle('active', panel.dataset.tabPanel === tabId);
		});
	}

	buttons.forEach((button) => {
		button.addEventListener('click', () => activateTab(button.dataset.tab));
	});
})();
