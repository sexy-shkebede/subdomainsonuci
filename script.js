const canvas = document.getElementById('canvas');

function createAvatar() {
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    
    // Случайная позиция по вертикали
    avatar.style.top = Math.random() * 80 + 'vh';
    
    // Случайная скорость
    avatar.style.animationDuration = (Math.random() * 3 + 2) + 's';
    
    canvas.appendChild(avatar);
    
    // Удаляем элемент после анимации
    setTimeout(() => avatar.remove(), 6000);
}

// Создаем новую аватарку каждые 800мс
setInterval(createAvatar, 800);
