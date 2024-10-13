// CONSTANTS
const MaxTitleLength = 25;
const MaxDescriptionLength = 200;
const MaxTagLength = 20;
const pageSize = 6;

const addTaskButton = document.getElementById("add-task-button");
const taskList = document.getElementById("task-list");
const showCompletedFilter = document.getElementById("isCompleted-filter");

// VARIABLES
let lastEditedTask;
let currentPage = 1;
let totalPages = 0;


// EVENTS
window.addEventListener('loadPage', (event) => {
    let token = localStorage.getItem('authToken');
    if (token !== null)
    {
        loadTasks(1, showCompletedFilter.checked);
    }
});

window.addEventListener('login', (event) => {
    let token = localStorage.getItem('authToken');
    if (token !== null)
    {
        loadTasks(currentPage, showCompletedFilter.checked);
    }
    else
    {
        taskList.innerHTML = '';
    }
});


window.addEventListener('DOMContentLoaded', () => {
    const savedFilterState = localStorage.getItem('isCompletedFilter');

    if (savedFilterState !== null) {
        showCompletedFilter.checked = savedFilterState === 'true';
    }
});

addTaskButton.onclick = createTask;

showCompletedFilter.addEventListener('change', () => {
    localStorage.setItem('isCompletedFilter', showCompletedFilter.checked);
});


// CLASSES
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


// API METHODS
const tasksApiBaseUrl = "https://todolist-1-9o39.onrender.com/api/tasks";
const tagsApiBaseUrl = "https://todolist-1-9o39.onrender.com/api/tags";

// Get all tasks
async function fetchTasksApi() {
    const response = await fetch(tasksApiBaseUrl, {
        headers: {
            "Token": `${localStorage.getItem('authToken')}`
        }
    });
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

async function fetchPaginatedTasksApi(page = 1, size = 6) {
    const response = await fetch(`${tasksApiBaseUrl}/paginated?pageNumber=${page}&pageSize=${size}`, {
        headers: {
            "Token": `${localStorage.getItem('authToken')}`
        }
    });
    if (!response.ok) throw new Error("Network response error");
    const data = await response.json(); 

    totalPages = Math.ceil(data.totalCount / size); 

    return data.tasks.map(task => new Task(
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

async function fetchFilteredTasksApi(page = 1, size = 6, showCompleted = true) {
    const response = await fetch(`${tasksApiBaseUrl}/filtered?pageNumber=${page}&pageSize=${size}&showCompleted=${showCompleted}`, {
        headers: {
            "Token": `${localStorage.getItem('authToken')}`
        }
    });
    if (!response.ok) throw new Error("Network response error");
    const data = await response.json(); 

    totalPages = Math.ceil(data.totalCount / size); 

    return data.tasks.map(task => new Task(
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

// Add new task
async function addTaskApi(task) {
    const response = await fetch(tasksApiBaseUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Token": `${localStorage.getItem('authToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({
            title: task.title,
            description: task.description,
            createdTime: task.createdTime,
            userId: task.userId,
            tagIds: task.tagIds
        })
    });
    if (!response.ok) throw new Error(`Failed to add task: ${error.message || 'Unknown error'}`);
    return await response.json();     
}

// Update existing task
async function updateTaskApi(taskId, updatedTask) {
    const response = await fetch(`${tasksApiBaseUrl}/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            "Token": `${localStorage.getItem('authToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({
            title: updatedTask.title,
            description: updatedTask.description,
            lastUpdateTime: updatedTask.lastUpdateTime,
            isCompleted: updatedTask.isCompleted,
            tagIds: updatedTask.tagIds
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update task: ${errorText}`);
    }

    // Check if the response has content
    const responseText = await response.text();
    if (responseText) {
        return JSON.parse(responseText); // Return JSON response
    }
    return {}; // Return empty object if no content
}

// Delete task
async function deleteTaskApi(taskId) {
    const response = await fetch(`${tasksApiBaseUrl}/${taskId}`, {
        method: 'DELETE',
        headers: {
            "Token": `${localStorage.getItem('authToken')}`
        },
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to delete task');
}

// Add new tag
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

// Delete tag
async function deleteTagApi(tagId) {
    const response = await fetch(`${tagsApiBaseUrl}/${tagId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete tag');
}

// update pagination elements
function updatePaginationControls(totalPages) {
    document.getElementById("next-page").disabled = currentPage >= totalPages;
    document.getElementById("previous-page").disabled = currentPage <= 1;
    document.getElementById("pagination-info").textContent = `Page ${currentPage} of ${totalPages}`;
}

// load Existing tasks
async function loadTasks(page = 1) {
    try {
        const tasks = await fetchPaginatedTasksApi(page, pageSize);
        taskList.innerHTML = ""; 
        tasks.forEach(task => displayTask(task));

        updatePaginationControls(totalPages);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

async function loadTasks(page = 1, showCompleted = true) {
    try {
        const tasks = await fetchFilteredTasksApi(page, pageSize, showCompleted);
        taskList.innerHTML = ""; 
        tasks.forEach(task => displayTask(task));

        updatePaginationControls(totalPages);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// isCompleted filtering
showCompletedFilter.addEventListener("change", function() {
    const isChecked = this.checked;
    currentPage = 1;
    loadTasks(currentPage, isChecked); // передаем текущее значение чекбокса
});

// next page pagination
document.getElementById("next-page").addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadTasks(currentPage, showCompletedFilter.checked);
    }
});

// previous page pagination
document.getElementById("previous-page").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        loadTasks(currentPage, showCompletedFilter.checked);
    }
});



// TASK METHODS

// delete task in Api and taskElement
async function deleteTask(taskElement, taskId) {
    try {
        // delete in Api
        await deleteTaskApi(taskId);
        // delete animation
        taskElement.classList.add("fade-out"); 
        setTimeout(() => {
            taskList.removeChild(taskElement);
        }, 500);
        loadTasks(currentPage, showCompletedFilter.checked);
    } catch (error) {
        console.error("Failed to delete task:", error);
    }
}

// create and add tagElement to Task
function createTagElement(tag, task, tagsList) {
    // create tag element
    const tagElement = document.createElement("div");
    tagElement.setAttribute("tag-id", tag.id);
    tagElement.classList.add("task-tag");
    tagElement.innerHTML = `<span class="task-tag-title">${tag.name}</span><button class="remove-tag-button">x</button>`;

    // add remove tag button and its logic
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

// add Tag, that already exists in db, I don't like this with addNewTag, maybe it needs refactoring
async function addExistingTag(tagsList, taskId, tagName, task) {
    // dont add empty tag
    if (tagName.trim() === "") return;

    try {
        // add tag to api, if such tag exists -> take it id
        const newTag = await addTagApi(tagName);

        // add tag id to task
        const tagIds = task.tags.map(tag => tag.id);  
        tagIds.push(newTag.id); 

        // create updateTaskDto
        const updatedTask = {
            title: task.title,
            description: task.description,
            lastUpdateTime: new Date().toISOString(),
            isCompleted: task.isCompleted,
            tagIds: tagIds  
        };

        // Update task Api
        await updateTaskApi(taskId, updatedTask);

        // Create tag element
        const tagElement = document.createElement("div");
        tagElement.setAttribute("tag-id", newTag.id)
        tagElement.classList.add("task-tag");
        tagElement.innerHTML = `<span class="task-tag-title">${newTag.name}</span><button class="remove-tag-button">x</button>`;

        // Add tag remove button and remove logic
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

        // add tagElement to taskElement
        tagsList.appendChild(tagElement);
    } catch (error) {
        console.error("Failed to add new tag:", error);
    }
}

async function removeExistingTag(tagId, taskId, tagsList, tagElement, task) {
    try {
        // Remove tag from frontend
        tagsList.removeChild(tagElement);

        // Update tag IDs (remove the tag's ID)
        const updatedTagIds = task.tags.filter(t => t.id !== tagId).map(t => t.id);

        // Update task with the new tag list
        const updatedTask = {
            title: task.title,
            description: task.description,
            lastUpdateTime: new Date().toISOString(),
            isCompleted: task.isCompleted,
            tagIds: updatedTagIds
        };

        await updateTaskApi(taskId, updatedTask);
        console.log("Tag removed successfully");
    } catch (error) {
        console.error("Failed to remove tag:", error);
    }
}

// Add new tag to api and task
async function addNewTag(tagsList, taskElement, tagName) {
    // Dont add empty tags
    if (tagName.trim() === "") return;  

    try {
        // Add tag to api
        const newTag = await addTagApi(tagName);

        // Create tagElement
        const tagElement = document.createElement("div");
        tagElement.classList.add("task-tag");
        tagElement.setAttribute("tag-id", newTag.id); 
        tagElement.innerHTML = `<span class="task-tag-title">${newTag.name}</span><button class="remove-tag-button">x</button>`;

        // Add remove tag button
        tagElement.querySelector(".remove-tag-button").onclick = async function () {
            tagsList.removeChild(tagElement);
            // maybe add remove tag from api
        };

        // add tagElement to taskElement
        tagsList.appendChild(tagElement);
    } catch (error) {
        console.error("Failed to add new tag:", error);
    }
}

// Add new task to api
async function saveNewTask(taskElement) {
    // Get fields values
    const title = taskElement.querySelector(".task-title-input").value;
    const description = taskElement.querySelector(".task-description-input").value;

    // Validate title
    if (!title.trim()) {
        alert("Task title cannot be empty!");
        return;
    }

    // Get task tagIds
    const tagElements = taskElement.querySelectorAll(".task-tag");
    const tagIds = Array.from(tagElements).map(tagElement => {
        return tagElement.getAttribute("tag-id");
    }).filter(id => id !== null); 

    // Create addTaskDto
    const newTask = {
        title: title,
        description: description,
        createdTime: new Date().toISOString(),
        userId: 1, // it replaces at backend
        tagIds: tagIds
    };

    try {
        const savedTask = await addTaskApi(newTask);  
        switchToViewMode(taskElement);
        // Set taskElement id
        taskElement.setAttribute("task-id", savedTask.id);
        const checkbox = taskElement.querySelector(".task-checkbox");
        checkbox.style.display = "block";
    } catch (error) {
        console.error("Error saving new task:", error);
    }
}

// Update existed task and save changes
async function saveTaskChanges(taskElement) {
    const taskId = taskElement.getAttribute("task-id");

    // Take values
    const title = taskElement.querySelector(".task-title-input").value;
    const description = taskElement.querySelector(".task-description-input").value;

    // Validate title
    if (!title.trim()) {
        alert("Task title cannot be empty!");
        return;
    }

    // Update edit time
    const lastUpdateTime = new Date().toISOString();

    // Get task tagIds
    const tagElements = taskElement.querySelectorAll(".task-tag");
    const tagIds = Array.from(tagElements).map(tagElement => {
        return tagElement.getAttribute("tag-id");
    }).filter(id => id !== null); 

    // Get isCompleted
    const isCompleted = taskElement.querySelector(".task-checkbox").checked;

    // Dto updateTask
    const updatedTask = {
        title: title,
        description: description,
        lastUpdateTime: lastUpdateTime,
        isCompleted: isCompleted,
        tagIds: tagIds 
    };

    try {
        const response = await updateTaskApi(taskId, updatedTask);
        console.log("Task updated successfully:", response); 
        switchToViewMode(taskElement);
    } catch (error) {
        console.error("Error updating task:", error);
    }
}

async function saveTaskCompleted(taskElement) {
    const taskId = taskElement.getAttribute("task-id");

    // Take values
    const title = taskElement.querySelector(".task-title").textContent;
    const description = taskElement.querySelector(".task-description").textContent;

    // Update edit time
    const lastUpdateTime = new Date().toISOString();

    // Get task tagIds
    const tagElements = taskElement.querySelectorAll(".task-tag");
    const tagIds = Array.from(tagElements).map(tagElement => {
        return tagElement.getAttribute("tag-id");
    }).filter(id => id !== null); 

    // Get isCompleted
    const isCompleted = taskElement.querySelector(".task-checkbox").checked;

    // Dto updateTask
    const updatedTask = {
        title: title,
        description: description,
        lastUpdateTime: lastUpdateTime,
        isCompleted: isCompleted,
        tagIds: tagIds 
    };

    try {
        const response = await updateTaskApi(taskId, updatedTask);
        console.log("Task updated successfully:", response); 
        if (showCompletedFilter.checked === false)
        {
            loadTasks(currentPage, showCompletedFilter.checked);
        }
    } catch (error) {
        console.error("Error updating task:", error);
    }
}

// Create and display task, that already exists in api
function displayTask(task) {
    // Create task Element
    const taskElement = document.createElement("li");
    taskElement.classList.add("task");
    taskElement.setAttribute("task-id", task.id);

    // Task header container
    const taskHeader = document.createElement("div");
    taskHeader.classList.add("task-head");

    // Title
    const title = document.createElement("h3");
    title.classList.add("task-title");
    title.textContent = task.title;
    taskHeader.appendChild(title);

    // IsComplete checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.isCompleted;
    checkbox.classList.add("task-checkbox");

    // Add event listener to checkbox
    checkbox.addEventListener('change', () => {
        task.isCompleted = checkbox.checked;
        saveTaskCompleted(taskElement);
    });
    taskHeader.appendChild(checkbox);

    taskElement.appendChild(taskHeader);

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
    tagInput.required = true;
    tagInput.onkeydown = function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addExistingTag(tagsList, task.id, tagInput.value, task);
            tagInput.value = "";
        }
    }
    tagInput.style.display = "none";
    tagsDiv.appendChild(tagInput);

    taskElement.appendChild(tagsDiv);

    // Buttons 
    const taskButtons = document.createElement("div");
    taskButtons.classList.add("task-buttons");

    // Edit button
    const editButton = document.createElement("button");
    editButton.classList.add("edit-task-button");
    editButton.textContent = "Edit";
    editButton.onclick = function () {
        switchToEditMode(taskElement);
    };
    taskButtons.appendChild(editButton);

    // Save button
    const saveButton = document.createElement("button");
    saveButton.classList.add("update-task-button");
    saveButton.textContent = "Save";
    saveButton.style.display = "none";
    saveButton.onclick = function () {
        saveTaskChanges(taskElement);
    };
    taskButtons.appendChild(saveButton);

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-task-button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function () {
        deleteTask(taskElement, task.id);
    };
    taskButtons.appendChild(deleteButton);

    taskElement.appendChild(taskButtons);

    // add task to list
    taskList.append(taskElement);
}

// Create new Task
function createTask() {
    // Change view last editing task
    if (lastEditedTask != null)
    {
        switchToViewMode(lastEditedTask);
    }
        
    // Create task element
    const taskElement = document.createElement("li");
    taskElement.classList.add("task");

    // Task header container
    const taskHeader = document.createElement("div");
    taskHeader.classList.add("task-head");

    // Title
    const titleInput = document.createElement("input");
    titleInput.classList.add("task-title-input");
    titleInput.type = "text";
    titleInput.value = "Task title"; 
    titleInput.maxLength = MaxTitleLength;
    titleInput.required = true;
    taskHeader.appendChild(titleInput);

    // IsComplete checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("task-checkbox");
    checkbox.style.display = "none";
    checkbox.addEventListener('change', () => {
        task.isCompleted = checkbox.checked;
        saveTaskCompleted(taskElement);
    });
    taskHeader.appendChild(checkbox);

    taskElement.appendChild(taskHeader);

    // Set Dates
    const datesDiv = document.createElement("div");
    datesDiv.classList.add("task-dates");
    const createdTime = new Date().toISOString();
    datesDiv.innerHTML = `<p>Created: <span class="task-created-time">${formatDate(createdTime)}</span></p>
                          <p>Last Update: <span class="task-updated-time">${formatDate(createdTime)}</span></p>`;
    taskElement.appendChild(datesDiv);

    // Description input
    const descriptionInput = document.createElement("textarea");
    descriptionInput.classList.add("task-description-input");
    descriptionInput.value = "This is a new task description.";
    descriptionInput.maxLength = MaxDescriptionLength;
    taskElement.appendChild(descriptionInput);

    // Tags
    const tagsDiv = document.createElement("div");
    tagsDiv.classList.add("task-tags");

    const tagsTitle = document.createElement("h4");
    tagsTitle.textContent = "Tags:";
    tagsDiv.appendChild(tagsTitle);

    const tagsList = document.createElement("div");
    tagsList.classList.add("task-tags-list");
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
            addNewTag(tagsList, taskElement, tagInput.value);
            tagInput.value = "";
        }
    }
    tagsDiv.appendChild(tagInput);

    taskElement.appendChild(tagsDiv);

    // Add buttons
    const taskButtons = document.createElement("div");
    taskButtons.classList.add("task-buttons");

    // Edit button
    const editButton = document.createElement("button");
    editButton.classList.add("edit-task-button");
    editButton.textContent = "Edit";
    editButton.style.display = "none";
    editButton.onclick = function () {
        switchToEditMode(taskElement);
    };
    taskButtons.appendChild(editButton);

    // Save Button
    const saveButton = document.createElement("button");
    saveButton.classList.add("update-task-button");
    saveButton.textContent = "Save";
    saveButton.onclick = function () {
        saveNewTask(taskElement);
    };
    taskButtons.appendChild(saveButton);

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-task-button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function () {
        deleteTask(taskElement);
    };
    taskButtons.appendChild(deleteButton);

    taskElement.appendChild(taskButtons);

    // Update last editing task
    lastEditedTask = taskElement;

    // Add task to list
    taskList.insertBefore(taskElement, taskList.firstChild);
}

// Change view to Edit mode, replace fields to inputs
function switchToEditMode(taskElement) {
    // Find and replace title to title input
    const taskHead = taskElement.querySelector(".task-head");
    const title = taskHead.querySelector(".task-title");
    const titleInput = document.createElement("input");
    titleInput.classList.add("task-title-input");
    titleInput.type = "text";
    titleInput.value = title.textContent;
    titleInput.maxLength = MaxTitleLength;
    titleInput.required = true;
    taskHead.replaceChild(titleInput, title);

    // Complete checkbox
    const taskCheckbox = taskElement.querySelector(".task-checkbox");
    taskCheckbox.style.display = "none";
    
    // Find and replace description to description input
    const description = taskElement.querySelector(".task-description");
    const descriptionInput = document.createElement("textarea");
    descriptionInput.classList.add("task-description-input");
    descriptionInput.value = description.textContent; 
    descriptionInput.maxLength = MaxDescriptionLength;
    taskElement.replaceChild(descriptionInput, description);

    // Change buttons visibility
    const editButton = taskElement.querySelector(".edit-task-button");
    editButton.style.display = "none";
    const saveButton = taskElement.querySelector(".update-task-button");
    saveButton.style.display = "inline";

    // Show tags input
    const tagInput = taskElement.querySelector(".add-tag-input");
    tagInput.style.display = "block"; 

    // Show tags buttons
    const removeTagButtons = taskElement.querySelectorAll(".remove-tag-button");
    removeTagButtons.forEach(button => {
        button.style.display = "inline"; 
    });

    // Updated last edited task
    lastEditedTask = taskElement;
}

// Change view to View mode, replace inputs to fields
function switchToViewMode(taskElement) {
    // Find and replace title input to title
    const taskHead = taskElement.querySelector(".task-head");
    const titleInput = taskHead.querySelector(".task-title-input");
    const title = document.createElement("h3");
    title.classList.add("task-title");
    title.textContent = titleInput.value;
    taskHead.replaceChild(title, titleInput);   

    // Complete checkbox
    const taskCheckbox = taskElement.querySelector(".task-checkbox");
    taskCheckbox.style.display = "inline";

    // Find and replace description input to description field
    const descriptionInput = taskElement.querySelector(".task-description-input");
    const description = document.createElement("p");
    description.classList.add("task-description");
    description.textContent = descriptionInput.value; 
    taskElement.replaceChild(description, descriptionInput);

    // Update time (maybe redudant)
    const updatedTime = new Date().toISOString();
    const updatedTimeElement = taskElement.querySelector(".task-updated-time");
    updatedTimeElement.textContent = formatDate(updatedTime);

    // Update buttons visibility
    const editButton = taskElement.querySelector(".edit-task-button");
    editButton.style.display = "inline";
    const saveButton = taskElement.querySelector(".update-task-button");
    saveButton.style.display = "none";
    
    // Hide tags input
    const tagInput = taskElement.querySelector(".add-tag-input");
    tagInput.style.display = "none"; 

    // Hide tags buttons
    const removeTagButtons = taskElement.querySelectorAll(".remove-tag-button");
    removeTagButtons.forEach(button => {
        button.style.display = "none"; 
    });

    // Update last edited task
    if (lastEditedTask === taskElement)
        lastEditedTask = null;
}


// Help function for dates
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    return new Date(dateString).toLocaleString('en-US', options);
}
