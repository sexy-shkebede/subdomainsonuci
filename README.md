# shkbd: терминал-визитка

Сайт в стиле i3-райса: терминал с `fastfetch` и `neofetch` (вместо лого Арча ава), htop, ranger и cava поверх обоев, которые рисуются кодом.

## Как залить на GitHub Pages

1. Создай репозиторий `sexy-shkebede.github.io`, тогда сайт будет на `https://sexy-shkebede.github.io`. Можно любое другое имя, тогда адрес будет `https://sexy-shkebede.github.io/имя-репо/`.
2. Залей в корень репозитория пять файлов: `index.html`, `style.css`, `config.js`, `app.js`, `avatar.jpg` (Add file → Upload files).
3. Settings → Pages → Source: **Deploy from a branch**, ветка `main`, папка `/ (root)`, Save.
4. Через минуту-две ссылка на сайт появится там же, вверху страницы Pages.

Свой домен (например shkbd.su) подключается там же, в поле Custom domain, плюс CNAME-запись у регистратора.

## Что где менять

- `config.js`: ник, строки fastfetch, about, ссылки, проекты, стек, треки в панели.
- `avatar.jpg`: ава. Замени файл с тем же именем, ascii для neofetch пересчитается сам.
- `style.css`: цвета тем, блоки `[data-theme="..."]`.

## Команды

`help`, `fastfetch`, `neofetch`, `about`, `links`, `projects`, `stack`, `ls`, `cd`, `cat`, `tree`, `open`, `theme`, `playerctl`, `history`, `clear` и пара пасхалок.
`fastfetch --logo ascii` или `--logo none` меняют лого. Tab дополняет, стрелки листают историю.

## Открыть локально

Двойной клик по `index.html` работает, но браузер не даёт читать пиксели авы с диска, поэтому neofetch покажет заранее посчитанный ascii.
Чтобы всё было как на GitHub: `python3 -m http.server` в этой папке и открыть http://localhost:8000
