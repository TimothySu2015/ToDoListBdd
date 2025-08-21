using MediatR;
using ToDoListBDD.API.ApplicationDTOs;

namespace ToDoListBDD.API.ApplicationCommands;

public class UpdateTaskStatusCommand : IRequest<TaskDto>
{
    public int TaskId { get; set; }
    public bool IsCompleted { get; set; }
}