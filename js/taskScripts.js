const addTaskButton = document.getElementById("add-task-button");
const taskList = document.getElementById("task-list");

// Constants
const MaxTitleLength = 25;
const MaxDescriptionLength = 200;
const MaxTagLength = 20;

// Classes
class Tag {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

class Task {
    constructor(id, title, description, createdTime, lastUpdateTime, isCompleted, userId, tags = []) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.createdTime = createdTime;
        this.lastUpdateTime = lastUpdateTime;
        this.isCompleted = isCompleted;
        this.userId = userId;
        this.tags = tags.map(tag => new Tag(tag.id, tag.name)); 
    }

    addTag(tag) {
        this.tags.push(new Tag(tag.id, tag.name));
    }

    removeTag(tagId) {
        this.tags = this.tags.filter(tag => tag.id !== tagId);
    }
}

// Api methods
const tasksApiBaseUrl = "http://localhost:8080/api/tasks";
const tagsApiBaseUrl = "http://localhost:8080/api/tags";

async function fetchTasksApi() {
    const response = await fetch(tasksApiBaseUrl);
    if (!response.ok) throw new Error("Network response error");
    const tasksDto = await response.json();
    return tasksDto.map(task => new Task(
        task.id,
        task.title,
        task.description,
        task.createdTime,
        task.lastUpdateTime,
        task.isCompleted,
        task.userId,
        task.tags
    ));
}

async function addTaskApi(task) {
    const response = await fetch(tasksApiBaseUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: task.title,
            description: task.description,
            createdTime: task.createdTime,
            lastUpdateTime: task.lastUpdateTime,
            isCompleted: task.isCompleted,
            userId: task.userId,
            tags: task.tags
        })
    });
    if (!response.ok) throw new Error('Failed to add task');
    return await response.json();     
}

async function updateTaskApi(taskId, updatedTask) {
    const response = await fetch(`${tasksApiBaseUrl}/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: updatedTask.title,
            description: updatedTask.description,
            lastUpdateTime: updatedTask.lastUpdateTime,
            isCompleted: updatedTask.isCompleted,
            tagIds: updatedTask.tagIds
        }),
    });
    // Check if the response is ok
    if (!response.ok) {
        const errorText = await response.text(); // Get response text
        console.error(`Failed to update task: ${errorText}`); // Log error details
        throw new Error(`Failed to update task: ${errorText}`); // Throw error with details
    }

    // If there's no content, return an empty object or handle accordingly
    if (response.status === 204) {
        return {}; // No content to return
    }

    return await response.json(); // Parse the response as JSON if available
}

async function deleteTaskApi(taskId) {
    const response = await fetch(`${tasksApiBaseUrl}/${taskId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
}

async function addTagApi(tagName) {
    const response = await fetch(tagsApiBaseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({name: tagName })
    });
    if (!response.ok) throw new Error('Failed to add tag');
    return await response.json();
}

async function deleteTagApi(tagId) {
    const response = await fetch(`${tagsApiBaseUrl}/${tagId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete tag');
}


// Events
window.onload = async () => {
    try {
        const tasks = await fetchTasksApi();
        tasks.forEach(task => displayTask(task));
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

addTaskButton.onclick = createTask;

// For tracking last task
let lastEditedTask;

// Task methods

async function deleteTask(taskElement, taskId) {
    try {
        console.log(taskId);
        await deleteTaskApi(taskId);
        taskElement.classList.add("fade-out"); 
        setTimeout(() => {
            taskList.removeChild(taskElement);
        }, 500);
    } catch (error) {
        console.error("Failed to delete task:", error);
    }
}

function createTagElement(tag, task, tagsList) {
    const tagElement = document.createElement("div");
    tagElement.setAttribute("tag-id", tag.id);
    tagElement.classList.add("task-tag");
    tagElement.innerHTML = `<span class="task-tag-title">${tag.name}</span><button class="remove-tag-button">x</button>`;

    removeTagButton = tagElement.querySelector(".remove-tag-button");
    removeTagButton.onclick = async () => {
        try {
            const updatedTagIds = task.tags.filter(t => t.id !== tag.id).map(t => t.id);
            await updateTaskApi(task.id, {
                ...task,
                tagIds: updatedTagIds
            });

            tagsList.removeChild(tagElement);
        } catch (error) {
            console.error("Failed to remove tag:", error);
        }
    };
    removeTagButton.style.display = "none";

    return tagElement;
}

async function addNewTag(tagsList, taskId, tagName, task) {
    if (tagName.trim() === "") return;

    try {
        const newTag = await addTagApi(tagName);

        const tagIds = task.tags.map(tag => tag.id);  
        tagIds.push(newTag.id); 

        const updatedTask = {
            title: task.title,
            description: task.description,
            lastUpdateTime: new Date().toISOString(),
            isCompleted: task.isCompleted,
            tagIds: tagIds  
        };

        await updateTaskApi(taskId, updatedTask);

        const tagElement = document.createElement("div");
        tagElement.setAttribute("tag-id", newTag.id)
        tagElement.classList.add("task-tag");
        tagElement.innerHTML = `<span class="task-tag-title">${newTag.name}</span><button class="remove-tag-button">x</button>`;

        tagElement.querySelector(".remove-tag-button").onclick = async () => {
            tagsList.removeChild(tagElement);
            const updatedTagIds = tagIds.filter(id => id !== newTag.id);
            const updatedTaskAfterRemoval = {
                title: task.title,
                description: task.description,
                lastUpdateTime: new Date().toISOString(),
                isCompleted: task.isCompleted,
                tagIds: updatedTagIds
            };

            await updateTaskApi(taskId, updatedTaskAfterRemoval);
        };

        tagsList.appendChild(tagElement);
    } catch (error) {
        console.error("Failed to add new tag:", error);
    }
}

async function saveTaskChanges(taskElement) {
    const taskId = taskElement.getAttribute("task-id");

    const title = taskElement.querySelector(".task-title-input").value;
    const description = taskElement.querySelector(".task-description-input").value;
    const lastUpdateTime = new Date().toISOString();

    const tagElements = taskElement.querySelectorAll(".task-tag");
    const tagIds = Array.from(tagElements).map(tagElement => {
        return tagElement.getAttribute("tag-id");
    }).filter(id => id !== null); 

    console.log("Updating task with ID:", taskId);
    console.log("Tag IDs:", tagIds);

    const updatedTask = {
        title: title,
        description: description,
        lastUpdateTime: lastUpdateTime,
        isCompleted: false,
        tagIds: tagIds // Make sure this is an array of integers
    };

    try {
        const response = await updateTaskApi(taskId, updatedTask);
        console.log("Task updated successfully:", response); // Log the successful response
    } catch (error) {
        console.error("Error updating task:", error);
    }
}


function displayTask(task) {
    const taskElement = document.createElement("li");
    taskElement.classList.add("task");
    taskElement.setAttribute("task-id", task.id);

    // Title
    const title = document.createElement("h3");
    title.classList.add("task-title");
    title.textContent = task.title;
    taskElement.appendChild(title);

    // Dates
    const datesDiv = document.createElement("div");
    datesDiv.classList.add("task-dates");
    datesDiv.innerHTML = `<p>Created: <span class="task-created-time">${formatDate(task["createdTime"])}</span></p>
                          <p>Last Update: <span class="task-updated-time">${formatDate(task["lastUpdateTime"])}</span></p>`;
    taskElement.appendChild(datesDiv);

    // Description
    const description = document.createElement("p");
    description.classList.add("task-description");
    description.textContent = task.description;
    taskElement.appendChild(description);

    // Tags
    const tagsDiv = document.createElement("div");
    tagsDiv.classList.add("task-tags");

    const tagsTitle = document.createElement("h4");
    tagsTitle.textContent = "Tags:";
    tagsDiv.appendChild(tagsTitle);

    const tagsList = document.createElement("div");
    tagsList.classList.add("task-tags-list");
    

    // Add existed tags
    task.tags.forEach(tag => {
        const tagElement = createTagElement(tag, task, tagsList);
        tagsList.appendChild(tagElement);
    });
    tagsDiv.appendChild(tagsList);

    // Add tag input
    const tagInput = document.createElement("input");
    tagInput.type = "text";
    tagInput.classList.add("add-tag-input");
    tagInput.placeholder = "New tag";
    tagInput.maxLength = MaxTagLength;
    tagInput.onkeydown = function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addNewTag(tagsList, task.id, tagInput.value, task);
            tagInput.value = "";
        }
    }
    tagInput.style.display = "none";
    tagsDiv.appendChild(tagInput);

    taskElement.appendChild(tagsDiv);

    // Buttons 
    const taskButtons = document.createElement("div");
    taskButtons.classList.add("task-buttons");

    // Edit
    const editButton = document.createElement("button");
    editButton.classList.add("edit-task-button");
    editButton.textContent = "Edit";
    editButton.onclick = function () {
        switchToEditMode(taskElement);
    };
    taskButtons.appendChild(editButton);

    // Кнопка Save
    const saveButton = document.createElement("button");
    saveButton.classList.add("update-task-button");
    saveButton.textContent = "Save";
    saveButton.style.display = "none";
    saveButton.onclick = function () {
        saveTaskChanges(taskElement, task);
        switchToViewMode(taskElement);
    };
    taskButtons.appendChild(saveButton);

    // Кнопка Delete
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-task-button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function () {
        deleteTask(taskElement, task.id);
    };
    taskButtons.appendChild(deleteButton);

    taskElement.appendChild(taskButtons);

    taskList.append(taskElement);
}


function createTask() {
    if (lastEditedTask != null)
        switchToViewMode(lastEditedTask);
    const taskElement = document.createElement("li");
    taskElement.classList.add("task");

    // Создаем input для заголовка задачи
    const titleInput = document.createElement("input");
    titleInput.classList.add("task-title-input");
    titleInput.type = "text";
    titleInput.value = "Task title"; // Значение по умолчанию
    titleInput.maxLength = MaxTitleLength;
    taskElement.appendChild(titleInput);

    // Блок с датами создания и обновления
    const datesDiv = document.createElement("div");
    datesDiv.classList.add("task-dates");
    const createdTime = new Date().toISOString();
    datesDiv.innerHTML = `<p>Created: <span class="task-created-time">${formatDate(createdTime)}</span></p>
                          <p>Last Update: <span class="task-updated-time">${formatDate(createdTime)}</span></p>`;
    taskElement.appendChild(datesDiv);

    // Создаем input для описания задачи
    const descriptionInput = document.createElement("textarea");
    descriptionInput.classList.add("task-description-input");
    descriptionInput.value = "This is a new task description.";
    descriptionInput.maxLength = MaxDescriptionLength;
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
    tagInput.maxLength = MaxTagLength;
    tagInput.onkeydown = function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addNewTag(tagsList, tagInput.value);
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
        deleteTaskApi(taskElement);
    };
    taskButtons.appendChild(deleteButton);

    taskElement.appendChild(taskButtons);

    lastEditedTask = taskElement;

    taskList.insertBefore(taskElement, taskList.firstChild);
}


function switchToEditMode(taskElement) {
    // Находим текстовые элементы (заголовок и описание)
    const title = taskElement.querySelector(".task-title");
    const description = taskElement.querySelector(".task-description");

    // Создаем инпут для заголовка
    const titleInput = document.createElement("input");
    titleInput.classList.add("task-title-input");
    titleInput.type = "text";
    titleInput.maxLength = MaxTitleLength;
    titleInput.value = title.textContent; // Устанавливаем значение из текста заголовка

    // Создаем текстовое поле для описания
    const descriptionInput = document.createElement("textarea");
    descriptionInput.classList.add("task-description-input");
    descriptionInput.value = description.textContent; // Устанавливаем значение из текста описания
    descriptionInput.maxLength = MaxDescriptionLength;

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

    lastEditedTask = taskElement;
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
    const updatedTime = new Date().toISOString();
    const updatedTimeElement = taskElement.querySelector(".task-updated-time");
    updatedTimeElement.textContent = formatDate(updatedTime);

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

    if (lastEditedTask === taskElement)
        lastEditedTask = null;
}


// Help functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    return new Date(dateString).toLocaleString('en-US', options);
}