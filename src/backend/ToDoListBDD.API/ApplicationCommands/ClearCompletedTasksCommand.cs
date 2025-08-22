using MediatR;
using ToDoListBDD.API.ApplicationDTOs;

namespace ToDoListBDD.API.ApplicationCommands;

public class ClearCompletedTasksCommand : IRequest<ClearCompletedTasksResponse>
{
}

public class ClearCompletedTasksResponse
{
    public int DeletedCount { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<TaskDto>? DeletedTasks { get; set; }
}