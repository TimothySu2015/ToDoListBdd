using MediatR;
using Microsoft.EntityFrameworkCore;
using ToDoListBDD.API.ApplicationCommands;
using ToDoListBDD.API.ApplicationDTOs;
using ToDoListBDD.API.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace ToDoListBDD.API.Application.Handlers;

public class UpdateTaskDescriptionCommandHandler : IRequestHandler<UpdateTaskDescriptionCommand, TaskDto>
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UpdateTaskDescriptionCommandHandler> _logger;

    public UpdateTaskDescriptionCommandHandler(ApplicationDbContext context, ILogger<UpdateTaskDescriptionCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<TaskDto> Handle(UpdateTaskDescriptionCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks.FindAsync(new object[] { request.TaskId }, cancellationToken);

        if (task == null)
        {
            throw new ArgumentException($"找不到 ID 為 {request.TaskId} 的任務");
        }

        var oldDescription = task.Description;
        task.Description = request.Description;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation($"Task description updated: ID={request.TaskId}, Old='{oldDescription}', New='{request.Description}'");

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