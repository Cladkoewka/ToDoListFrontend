const addTaskButton = document.getElementById("add-task-button");
const taskList = document.getElementById("task-list");

// Добавляем обработчик клика на кнопку добавления задачи
addTaskButton.onclick = addTask;

function addTask() {
    const taskElement = document.createElement("li");
    taskElement.classList.add("task");

    // Создаем input для заголовка задачи
    const titleInput = document.createElement("input");
    titleInput.classList.add("task-title-input");
    titleInput.type = "text";
    titleInput.value = "Task title"; // Значение по умолчанию
    taskElement.appendChild(titleInput);

    // Блок с датами создания и обновления
    const datesDiv = document.createElement("div");
    datesDiv.classList.add("task-dates");
    const createdTime = new Date().toISOString().slice(0, 16).replace("T", " ");
    datesDiv.innerHTML = `<p>Created: <span class="task-created-time">${createdTime}</span></p>
                          <p>Last Update: <span class="task-updated-time">${createdTime}</span></p>`;
    taskElement.appendChild(datesDiv);

    // Создаем input для описания задачи
    const descriptionInput = document.createElement("textarea");
    descriptionInput.classList.add("task-description-input");
    descriptionInput.value = "This is a new task description.";
    taskElement.appendChild(descriptionInput);

    // Контейнер для тегов
    const tagsDiv = document.createElement("div");
    tagsDiv.classList.add("task-tags");

    const tagsTitle = document.createElement("h4");
    tagsTitle.textContent = "Tags:";
    tagsDiv.appendChild(tagsTitle);

    const tagsList = document.createElement("div");
    tagsList.classList.add("task-tags-list");

    tagsDiv.appendChild(tagsList);

    // Поле для добавления нового тега
    const tagInput = document.createElement("input");
    tagInput.type = "text";
    tagInput.classList.add("add-tag-input");
    tagInput.placeholder = "New tag";
    tagInput.onkeydown = function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addTag(tagsList, tagInput.value);
            tagInput.value = "";
        }
    }
    tagsDiv.appendChild(tagInput);

    taskElement.appendChild(tagsDiv);

    // Блок кнопок
    const taskButtons = document.createElement("div");
    taskButtons.classList.add("task-buttons");

    // Кнопка Edit
    const editButton = document.createElement("button");
    editButton.classList.add("edit-task-button");
    editButton.textContent = "Edit";
    editButton.style.display = "none";
    editButton.onclick = function () {
        switchToEditMode(taskElement);
    };
    taskButtons.appendChild(editButton);

    // Кнопка Save
    const saveButton = document.createElement("button");
    saveButton.classList.add("update-task-button");
    saveButton.textContent = "Save";
    saveButton.onclick = function () {
        switchToViewMode(taskElement);
    };
    taskButtons.appendChild(saveButton);

    // Кнопка Delete
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-task-button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function () {
        taskList.removeChild(taskElement);
    };
    taskButtons.appendChild(deleteButton);

    taskElement.appendChild(taskButtons);

    taskList.appendChild(taskElement);
}


function switchToEditMode(taskElement) {
    // Находим текстовые элементы (заголовок и описание)
    const title = taskElement.querySelector(".task-title");
    const description = taskElement.querySelector(".task-description");

    // Создаем инпут для заголовка
    const titleInput = document.createElement("input");
    titleInput.classList.add("task-title-input");
    titleInput.type = "text";
    titleInput.value = title.textContent; // Устанавливаем значение из текста заголовка

    // Создаем текстовое поле для описания
    const descriptionInput = document.createElement("textarea");
    descriptionInput.classList.add("task-description-input");
    descriptionInput.value = description.textContent; // Устанавливаем значение из текста описания

    // Заменяем текстовые элементы на инпуты
    taskElement.replaceChild(titleInput, title);
    taskElement.replaceChild(descriptionInput, description);

    // Переключаем видимость кнопок (скрываем "Edit", показываем "Save")
    const editButton = taskElement.querySelector(".edit-task-button");
    const saveButton = taskElement.querySelector(".update-task-button");
    editButton.style.display = "none";
    saveButton.style.display = "inline";

    // Скрываем поле добавления тега
    const tagInput = taskElement.querySelector(".add-tag-input");
    tagInput.style.display = "block"; // Показываем поле для добавления тега

    // Показываем кнопки удаления у тегов
    const removeTagButtons = taskElement.querySelectorAll(".remove-tag-button");
    removeTagButtons.forEach(button => {
        button.style.display = "inline"; 
    });
}


function switchToViewMode(taskElement) {
    // Находим инпуты
    const titleInput = taskElement.querySelector(".task-title-input");
    const descriptionInput = taskElement.querySelector(".task-description-input");
    
    // Создаем новые элементы для замены инпутов
    const title = document.createElement("h3");
    title.classList.add("task-title");
    title.textContent = titleInput.value; // Устанавливаем текст заголовка из инпута

    const description = document.createElement("p");
    description.classList.add("task-description");
    description.textContent = descriptionInput.value; // Устанавливаем текст описания из инпута

    // Заменяем инпуты на элементы текста
    taskElement.replaceChild(title, titleInput);
    taskElement.replaceChild(description, descriptionInput);

    // Обновляем дату последнего изменения
    const updatedTime = new Date().toISOString().slice(0, 16).replace("T", " ");
    const updatedTimeElement = taskElement.querySelector(".task-updated-time");
    updatedTimeElement.textContent = updatedTime;

    // Переключаем видимость кнопок (скрываем кнопку "Save", показываем "Edit")
    const editButton = taskElement.querySelector(".edit-task-button");
    const saveButton = taskElement.querySelector(".update-task-button");
    saveButton.style.display = "none";
    editButton.style.display = "inline";

    // Скрываем поле добавления тега
    const tagInput = taskElement.querySelector(".add-tag-input");
    tagInput.style.display = "none"; // Скрываем поле добавления тега

    // Скрываем кнопки удаления у тегов
    const removeTagButtons = taskElement.querySelectorAll(".remove-tag-button");
    removeTagButtons.forEach(button => {
        button.style.display = "none"; // Скрываем кнопки удаления тегов
    });
}


function addTag(tagsList, tag) {
    if (tag.trim() === "") return;

    const tagElement = document.createElement("div");
    tagElement.classList.add("task-tag");
    tagElement.innerHTML = `<span class="task-tag-title">${tag}</span><button class="remove-tag-button">x</button>`;

    // Обработчик кнопки удаления тега
    tagElement.querySelector(".remove-tag-button").onclick = function () {
        tagsList.removeChild(tagElement);
    };

    tagsList.appendChild(tagElement);
}