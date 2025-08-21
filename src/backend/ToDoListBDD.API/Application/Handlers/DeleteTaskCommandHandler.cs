using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ToDoListBDD.API.ApplicationCommands;
using ToDoListBDD.API.Infrastructure.Data;

namespace ToDoListBDD.API.Application.Handlers;

public class DeleteTaskCommandHandler : IRequestHandler<DeleteTaskCommand, bool>
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DeleteTaskCommandHandler> _logger;

    public DeleteTaskCommandHandler(
        ApplicationDbContext context,
        ILogger<DeleteTaskCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> Handle(DeleteTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks.FindAsync(request.TaskId);
        if (task == null)
        {
            throw new InvalidOperationException($"找不到 ID 為 {request.TaskId} 的任務");
        }

        // 記錄刪除操作到系統日誌
        _logger.LogInformation("Task deleted: ID={TaskId}, Description={Description}",
            task.Id, task.Description);

        _context.Tasks.Remove(task);
        var result = await _context.SaveChangesAsync(cancellationToken);
        return result > 0;
    }
}