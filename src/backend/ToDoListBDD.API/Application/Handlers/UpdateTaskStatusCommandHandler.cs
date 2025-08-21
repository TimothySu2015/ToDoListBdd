using MediatR;
using Microsoft.EntityFrameworkCore;
using ToDoListBDD.API.ApplicationCommands;
using ToDoListBDD.API.ApplicationDTOs;
using ToDoListBDD.API.Infrastructure.Data;

namespace ToDoListBDD.API.Application.Handlers;

public class UpdateTaskStatusCommandHandler : IRequestHandler<UpdateTaskStatusCommand, TaskDto>
{
    private readonly ApplicationDbContext _context;

    public UpdateTaskStatusCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TaskDto> Handle(UpdateTaskStatusCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks.FindAsync(new object[] { request.TaskId }, cancellationToken);
        
        if (task == null)
        {
            throw new ArgumentException($"找不到 ID 為 {request.TaskId} 的任務");
        }

        task.IsCompleted = request.IsCompleted;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new TaskDto
        {
            Id = task.Id,
            Description = task.Description,
            IsCompleted = task.IsCompleted,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
    }
}