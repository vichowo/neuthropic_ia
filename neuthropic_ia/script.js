document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.database();
    const content = document.getElementById('content');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const bubblesRef = db.ref('bubbles');
    const messagesRef = db.ref('messages');
    const userInfo = document.querySelector('.user-info p');
  
    let bubbles = {}; // Guardar las burbujas y su tamaño y menciones
    let superBubble = null; // La super burbuja central
    const initialDistance = 400; // Distancia inicial de las burbujas normales de la super burbuja
  
    // Solicitar nombre de usuario al cargar la página
    let userName = prompt('Por favor, ingresa tu nombre de usuario:');
    if (userName) {
        userInfo.textContent = userName;
    }
  
    document.getElementById('toggle-btn').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('closed');
    });
  
    document.getElementById('add-bubble-btn').addEventListener('click', function() {
        addRandomBubble();
    });
  
    sendMessageBtn.addEventListener('click', function() {
        const message = chatInput.value.trim();
        if (message) {
            const newMessageRef = messagesRef.push();
            newMessageRef.set({
                user: userName,
                text: message
            });
            chatInput.value = '';
        }
    });
  
    chatInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            sendMessageBtn.click();
        }
    });
  
    messagesRef.on('child_added', function(snapshot) {
        const message = snapshot.val();
        const messageElement = document.createElement('p');
        messageElement.textContent = `${message.user}: ${message.text}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
  
        increaseBubbleSize(message.text);
    });
  
    function addRandomBubble() {
        if (!superBubble) {
            alert('Primero debes crear la Super Burbuja.');
            return;
        }
  
        const superRect = superBubble.getBoundingClientRect();
        const centerX = superRect.left + superRect.width / 2;
        const centerY = superRect.top + superRect.height / 2;
  
        let newBubble;
        let positionFound = false;
        let attempts = 0;
  
        while (!positionFound && attempts < 100) {
            const angle = Math.random() * 2 * Math.PI;
            const top = centerY + initialDistance * Math.sin(angle);
            const left = centerX + initialDistance * Math.cos(angle);
  
            newBubble = document.createElement('div');
            newBubble.classList.add('bubble', 'normal'); // Añadir la clase .normal
            newBubble.style.top = `${top - content.offsetTop}px`;
            newBubble.style.left = `${left - content.offsetLeft}px`;
            newBubble.style.width = `100px`;
            newBubble.style.height = `100px`;
            newBubble.textContent = prompt('Ingresa el título de la burbuja:', 'Nueva burbuja');
            if (!newBubble.textContent) return;
  
            positionFound = true;
  
            const bubbleElements = document.getElementsByClassName('bubble');
            for (let i = 0; i < bubbleElements.length; i++) {
                const bubble = bubbleElements[i];
                if (bubble === superBubble) continue;
  
                const rect1 = newBubble.getBoundingClientRect();
                const rect2 = bubble.getBoundingClientRect();
  
                if (!(rect1.right < rect2.left || 
                      rect1.left > rect2.right || 
                      rect1.bottom < rect2.top || 
                      rect1.top > rect2.bottom)) {
                    positionFound = false;
                    break;
                }
            }
  
            attempts++;
        }
  
        if (positionFound) {
            newBubble.addEventListener('click', function() {
                const newTitle = prompt('Ingresa el título de la burbuja:', newBubble.textContent);
                if (newTitle) {
                    newBubble.textContent = newTitle;
                }
            });
  
            bubbles[newBubble.textContent.toLowerCase()] = { element: newBubble, size: 100, mentions: 0 }; // Guardar burbuja
            content.appendChild(newBubble);
  
            const newBubbleRef = bubblesRef.push();
            newBubbleRef.set({
                title: newBubble.textContent,
                size: 100,
                mentions: 0
            });
        } else {
            alert('No se encontró espacio para una nueva burbuja.');
        }
    }
  
    function addSuperBubble(title) {
        if (superBubble) return; // Solo una super burbuja
  
        superBubble = document.createElement('div');
        superBubble.classList.add('bubble', 'red-bubble');
        superBubble.style.top = `${(content.clientHeight - 100) / 2}px`;
        superBubble.style.left = `${(content.clientWidth - 100) / 2}px`;
        superBubble.textContent = title;
  
        superBubble.addEventListener('click', function() {
            const newTitle = prompt('Ingresa el título de la burbuja:', superBubble.textContent);
            if (newTitle) {
                superBubble.textContent = newTitle;
            }
        });
  
        content.appendChild(superBubble);
    }
  
    function increaseBubbleSize(message) {
        const words = message.toLowerCase().split(' ');
        words.forEach(word => {
            const bubbleRef = bubblesRef.orderByChild('title').equalTo(word);
            bubbleRef.once('value', snapshot => {
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        const bubbleData = childSnapshot.val();
                        bubbleData.mentions += 1;
                        bubbleData.size += 10;
  
                        const bubbleElement = document.querySelector(`.bubble[data-title="${bubbleData.title}"]`);
                        if (bubbleElement) {
                            bubbleElement.style.width = `${bubbleData.size}px`;
                            bubbleElement.style.height = `${bubbleData.size}px`;
                        }
  
                        bubblesRef.child(childSnapshot.key).update(bubbleData);
                    });
                }
            });
        });
    }
  
    // Inicialización de la super burbuja si existe en la base de datos
    bubblesRef.orderByChild('title').equalTo('superburbujaroja').once('value', snapshot => {
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const bubbleData = childSnapshot.val();
                addSuperBubble(bubbleData.title);
            });
        }
    });
  
    // Cargar burbujas existentes
    bubblesRef.on('child_added', function(snapshot) {
        const bubbleData = snapshot.val();
        if (bubbleData.title !== 'superburbujaroja') {
            const newBubble = document.createElement('div');
            newBubble.classList.add('bubble', 'normal'); // Añadir la clase .normal
            newBubble.style.width = `${bubbleData.size}px`;
            newBubble.style.height = `${bubbleData.size}px`;
            newBubble.textContent = bubbleData.title;
            newBubble.dataset.title = bubbleData.title;
  
            newBubble.addEventListener('click', function() {
                const newTitle = prompt('Ingresa el título de la burbuja:', newBubble.textContent);
                if (newTitle) {
                    newBubble.textContent = newTitle;
                    bubblesRef.child(snapshot.key).update({ title: newTitle });
                }
            });
  
            content.appendChild(newBubble);
        }
    });
  });