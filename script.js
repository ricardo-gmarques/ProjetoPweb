document.addEventListener("DOMContentLoaded", function() {
    const addServiceBtn = document.getElementById('addNewService');
    const modal = document.getElementById('taskModal');
    const closeModalBtn = document.querySelector('.close-btn');
    const saveTaskBtn = document.getElementById('saveTask');
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskResponsibleInput = document.getElementById('taskResponsible');
    const taskPriorityInput = document.getElementById('taskPriority');
    const taskDueDateInput = document.getElementById('taskDueDate');
    const deleteTaskBtn = document.getElementById('deleteTask');
    const exitModalBtn = document.getElementById('exitModal');
    const limparBtn = document.getElementById('limparBtn'); // Botão "Limpar"

    // Função para formatar a data no formato dd/mm
        function formatDate(date) {
            let day = date.getDate();
            let month = date.getMonth() + 1; // Janeiro é 0!
            return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`;
        }
    
        // Função para calcular o número da semana do ano
        function getWeekNumber(date) {
            const startDate = new Date(date.getFullYear(), 0, 1); // 1º de janeiro
            const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000)); // dias desde 1º de janeiro
            return Math.ceil((days + startDate.getDay() + 1) / 7); // Número da semana
        }
    
        // Obtém a data atual
        const today = new Date();
        
        // Calcula o número da semana
        const weekNumber = getWeekNumber(today);
    
        // Define a data de início da semana (segunda-feira)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Ajusta para segunda-feira
        
        // Define a data de fim da semana (domingo)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Ajusta para domingo
    
        // Atualiza o número da semana na sidebar
        const weekNumberElement = document.getElementById('weekNumber');
        weekNumberElement.textContent = `SEMANA ${weekNumber}`;
    
        // Atualiza o conteúdo do período na sidebar
        const weekPeriodElement = document.getElementById('weekPeriod');
        weekPeriodElement.textContent = `${formatDate(startOfWeek)} a ${formatDate(endOfWeek)}`;
   
    


    const taskContainers = {
        inspection: document.getElementById('inspectionTasks'),
        maintenance: document.getElementById('maintenanceTasks'),
        ok: document.getElementById('okTasks')
    };

    let editingTask = null;  // Variável para armazenar a tarefa que está sendo editada

    // Função para limpar os campos do modal
    function limparCampos() {
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        taskResponsibleInput.value = '';
        taskPriorityInput.value = '';
        taskDueDateInput.value = '';
    }

    limparBtn.addEventListener('click', limparCampos);


    // Abrir o modal para adicionar tarefa
    addServiceBtn.addEventListener('click', function() {
        modal.style.display = "block";
        editingTask = null;  // Resetando a tarefa que estava sendo editada
        limparCampos();
    });

    // Fechar o modal clicando no botão de fechar
    closeModalBtn.addEventListener('click', function() {
        modal.style.display = "none";
    });

    // Fechar o modal clicando no botão SAIR sem salvar
    exitModalBtn.addEventListener('click', function() {
        modal.style.display = "none";
    });

    // Salvar a tarefa
    saveTaskBtn.addEventListener('click', function() {
        const taskTitle = taskTitleInput.value;
        const taskDescription = taskDescriptionInput.value;
        const taskResponsible = taskResponsibleInput.value;
        const taskPriority = taskPriorityInput.value;
        const taskDueDate = taskDueDateInput.value;

        if (taskTitle && taskDescription && taskResponsible && taskPriority && taskDueDate) {
            if (editingTask) {
                // Atualizar a tarefa já existente
                editingTask.querySelector('.task-title strong').textContent = taskTitle;
                editingTask.querySelector('p:nth-of-type(2)').textContent = `Descrição: ${taskDescription}`;
                editingTask.querySelector('p:nth-of-type(3)').textContent = `Responsável: ${taskResponsible}`;
                editingTask.querySelector('p:nth-of-type(4)').textContent = `Prioridade: ${taskPriority}`;
                editingTask.querySelector('p:nth-of-type(5)').textContent = `Prazo: ${taskDueDate}`;
                setDeadlineColor(editingTask, taskDueDate);

                
            // Atualizar no LocalStorage
            updateTaskInLocalStorage(editingTask.dataset.title, {
                title: taskTitle,
                description: taskDescription,
                responsible: taskResponsible,
                priority: taskPriority,
                dueDate: taskDueDate
            });

            editingTask.dataset.title = taskTitle; // Atualizar o atributo data-title
        } else {
            // Adicionar nova tarefa
            const taskCard = createTaskCard(taskTitle, taskDescription, taskResponsible, taskPriority, taskDueDate, "inspection");
            taskContainers.inspection.appendChild(taskCard);
            saveTaskToLocalStorage(taskTitle, taskDescription, taskResponsible, taskPriority, taskDueDate);
        }
        modal.style.display = "none";
        limparCampos(); // Limpar os campos ao salvar
    } else {
        alert('Por favor, preencha todos os campos!');
    }
});

// Atualizar tarefa no LocalStorage
function updateTaskInLocalStorage(oldTitle, newTaskData) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.map(task => {
        if (task.title === oldTitle) {
            return { ...task, ...newTaskData };
        }
        return task;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

    // Função para criar o cartão de tarefa
    function createTaskCard(title, description, responsible, priority, dueDate, column) {
        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card');
        taskCard.draggable = true;

        taskCard.innerHTML = `
            <p class="task-title"><strong>${title}</strong></p>
            <p><strong>Descrição:</strong> ${description}</p>
            <p><strong>Responsável:</strong> ${responsible}</p>
            <p><strong>Prioridade:</strong> ${priority}</p>
            <p><strong>Prazo:</strong> ${dueDate}</p>
            <button class="edit-btn">Editar</button>
            <button class="delete-btn">Excluir</button>
        `;

        // Aplicar a tarja lateral
        setDeadlineColor(taskCard, dueDate, column);

        // Evento de arrastar a tarefa
        taskCard.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text', title);
        });

        // Excluir tarefa
        taskCard.querySelector('.delete-btn').addEventListener('click', function() {
            taskCard.remove();
            deleteTaskFromLocalStorage(title);  // Exclui a tarefa do LocalStorage
        });

        // Editar tarefa
        taskCard.querySelector('.edit-btn').addEventListener('click', function() {
            // Preenche os campos do modal com os dados da tarefa
            taskTitleInput.value = title;
            taskDescriptionInput.value = description;
            taskResponsibleInput.value = responsible;
            taskPriorityInput.value = priority;
            taskDueDateInput.value = dueDate;
            modal.style.display = "block";
            editingTask = taskCard;  // Define que essa é a tarefa a ser editada
        });

        return taskCard;
    }

    // Função para definir a cor da tarja lateral
    function setDeadlineColor(card, dueDate, column) {
        const today = new Date();
        const deadline = new Date(dueDate);
        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        if (column === "ok") {
            card.style.borderRight = "10px solid green";
        } else if (diffDays > 3) {
            card.style.borderRight = "10px solid blue";
        } else if (diffDays > 0) {
            card.style.borderRight = "10px solid yellow";
        } else {
            card.style.borderRight = "10px solid red";
        }
    }

   // Função para salvar tarefa no LocalStorage
   function saveTaskToLocalStorage(title, description, responsible, priority, dueDate) {
    const task = { title, description, responsible, priority, dueDate };
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Função para excluir tarefa do LocalStorage
function deleteTaskFromLocalStorage(title) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => task.title !== title);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Função para carregar as tarefas do LocalStorage
function loadTasksFromLocalStorage() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        const taskCard = createTaskCard(task.title, task.description, task.responsible, task.priority, task.dueDate);
        taskContainers.inspection.appendChild(taskCard);
    });
}

// Carregar tarefas ao inicializar
loadTasksFromLocalStorage();

// Arrastar e soltar nas colunas
document.querySelectorAll('.kanban-column').forEach(function(column) {
    column.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    column.addEventListener('drop', function(e) {
        e.preventDefault();
        const title = e.dataTransfer.getData('text');
        const taskCards = document.querySelectorAll('.task-card');
        let droppedTaskCard;

        taskCards.forEach(function(taskCard) {
            const titleElement = taskCard.querySelector('p strong');
            if (titleElement && titleElement.textContent === title) {
                droppedTaskCard = taskCard;
            }
        });

        if (droppedTaskCard) {
            column.querySelector('.task-container').appendChild(droppedTaskCard);
        }
    });
});
});
