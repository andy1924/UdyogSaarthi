import re
html = open('render.html', encoding='utf-8').read()
m = re.search(r'<div id="root">(.*?)</div>\s*<script type="module" src="/src/main', html, re.S)
root = m.group(1) if m else 'ROOT-NOT-FOUND'
print('ROOT_LEN:', len(root))
print('ROOT_HEAD:', root[:1500])
print('HAS_HEADING:', 'Udyog-Saarthi' in html)
print('HAS_ERROR_OVERLAY:', 'vite-error-overlay' in html)
for e in re.findall(r'<pre[^>]*>(.*?)</pre>', html, re.S)[:2]:
    print('PRE:', e[:500])
