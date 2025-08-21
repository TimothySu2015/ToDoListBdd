using MediatR;

namespace ToDoListBDD.API.ApplicationCommands;

public class DeleteTaskCommand : IRequest<bool>
{
    public int TaskId { get; set; }
}