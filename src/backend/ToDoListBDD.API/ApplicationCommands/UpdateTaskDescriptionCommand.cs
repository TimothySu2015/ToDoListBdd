using MediatR;
using ToDoListBDD.API.ApplicationDTOs;

namespace ToDoListBDD.API.ApplicationCommands;

public class UpdateTaskDescriptionCommand : IRequest<TaskDto>
{
    public int TaskId { get; set; }
    public string Description { get; set; } = string.Empty;
}