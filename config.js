/*
  config.js: всё про тебя лежит здесь.
  Поменял, сохранил, залил на GitHub, и сайт обновился.
  Если внутри строки нужна кавычка, пиши \" (или бери одинарные кавычки).
*/
window.SITE = {
  user: "shkbd",            // ник в промпте и в шапке fastfetch
  host: "holin",            // получится shkbd@holin
  name: "Wenduyx",
  avatar: "avatar.jpg",     // ава: в fastfetch картинкой, в neofetch из неё сам строится ascii

  theme: "dusk",            // тема по умолчанию: dusk, forest или nebula
  github: "sexy-shkebede",  // отсюда берётся живой счётчик репозиториев {repos}

  // строки fastfetch и neofetch: [название, значение, ссылка (можно не писать)]
  //   {repos}  — сколько у тебя публичных репо на GitHub (не загрузилось — строка скроется)
  //   {res}    — разрешение экрана того, кто смотрит сайт
  //   {uptime} — сколько открыта вкладка
  fetch: [
    ["OS",         "shkbd linux x86_64"],
    ["Host",       "ASUS P8P67 PRO Rev 3.1"],
    ["Uptime",     "19 years"],
    ["Packages",   "{repos} (github)"],
    ["Shell",      "zsh"],
    ["Resolution", "{res}"],
    ["WM",         "i3"],
    ["Terminal",   "alacritty"],
    ["GPU",        "NVIDIA GeForce GTS 450"],
    ["Role",       "hobbyist dev, material designer"],
    ["Focus",      "android modding, security research, infra"],
    ["GitHub",     "sexy-shkebede", "https://github.com/sexy-shkebede"],
    ["TikTok",     "@privet_gt",    "https://www.tiktok.com/@privet_gt"],
  ],

  // about и cat about.md
  about: [
    "# Wenduyx aka shkbd",
    "",
    "привет. мне 19, делаю проекты для себя и по интересу.",
    "ковыряю андроид изнутри: IL2CPP-хуки, smali, патчи APK,",
    "моды для VR-игр на Quest.",
    "ещё security research и своя инфраструктура на holin.im,",
    "а для души material design.",
    "",
    "где меня найти: links. над чем работаю: projects.",
  ],

  // ~/links и команда links. note — подпись рядом
  links: [
    { name: "github",   url: "https://github.com/sexy-shkebede",   note: "код и проекты" },
    { name: "tiktok",   url: "https://www.tiktok.com/@privet_gt", note: "тикток" },
    { name: "shkbd.su", url: "https://shkbd.su",                  note: "сайт" },
    { name: "holin.im", url: "https://holin.im",                  note: "мой сервер" },
  ],

  // ~/projects и команда projects. url можно оставить пустым
  projects: [
    { name: "SPM-ModGUI", desc: "мод-меню для VR-игр на Meta Quest",                                      tags: "c++, bnm-android, il2cpp, dobby", url: "" },
    { name: "holin.im",   desc: "личный сервер: сервисы в докере и ci/cd",                                tags: "linux, docker, ci/cd",           url: "https://holin.im" },
    { name: "tg-bots",    desc: "телеграм-боты на слабом железе: тв-боксы amlogic, телефон через termux", tags: "termux, linux",                  url: "" },
  ],

  // stack и cat stack.txt
  stack: [
    ["android", "BNM-Android, Dobby, IL2CPP, smali, патчинг APK, Magisk"],
    ["build",   "C++, NDK, CMake, Termux, proot-distro"],
    ["infra",   "Linux, Docker, CI/CD, свой сервер"],
    ["design",  "Material Design"],
  ],

  // треки в верхней панели: стрелки листают, пауза останавливает cava
  music: [
    "GTS 450 — fan solo (live)",
    "lofi radio — beats to mod to",
    "dial-up — handshake.wav",
  ],
};
