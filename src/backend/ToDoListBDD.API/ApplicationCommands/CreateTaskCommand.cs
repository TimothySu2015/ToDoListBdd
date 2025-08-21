using MediatR;
using ToDoListBDD.API.ApplicationDTOs;

namespace ToDoListBDD.API.ApplicationCommands;

public class CreateTaskCommand : IRequest<TaskDto>
{
    public string Description { get; set; } = string.Empty;
}