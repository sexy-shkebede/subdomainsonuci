const avatars = [];
const avatarSize = 80;

function createAvatar() {
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    
    // Начальная позиция сверху в случайном месте по горизонтали
    let x = Math.random() * (window.innerWidth - avatarSize);
    let y = -avatarSize;
    
    // Скорость (случайное направление и сила)
    let dx = (Math.random() - 0.5) * 10;
    let dy = Math.random() * 5 + 2; // Начальная скорость падения
    
    document.body.appendChild(avatar);
    
    const avatarObj = {
        element: avatar,
        x: x,
        y: y,
        dx: dx,
        dy: dy,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 10
    };
    
    avatars.push(avatarObj);
}

function update() {
    avatars.forEach(obj => {
        // Движение
        obj.x += obj.dx;
        obj.y += obj.dy;
        obj.rotation += obj.rotationSpeed;

        // Отскок от левой и правой стены
        if (obj.x <= 0 || obj.x >= window.innerWidth - avatarSize) {
            obj.dx *= -1;
            obj.rotationSpeed *= -1; // Меняем вращение при ударе
        }

        // Отскок от пола и потолка
        if (obj.y >= window.innerHeight - avatarSize) {
            obj.dy *= -1;
            obj.y = window.innerHeight - avatarSize; // Чтобы не провалился
        } else if (obj.y <= 0 && obj.dy < 0) {
            obj.dy *= -1;
        }

        // Применяем изменения
        obj.element.style.transform = `translate(${obj.x}px, ${obj.y}px) rotate(${obj.rotation}deg)`;
    });

    requestAnimationFrame(update);
}

// Создаем 10 аватарок для начала
for(let i = 0; i < 10; i++) {
    setTimeout(createAvatar, i * 300);
}

// Запускаем цикл анимации
update();

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    // Можно добавить логику, чтобы аватарки не вылетали за пределы при ресайзе
});
