using MediatR;
using Microsoft.EntityFrameworkCore;
using ToDoListBDD.API.ApplicationCommands;
using ToDoListBDD.API.ApplicationDTOs;
using ToDoListBDD.API.Infrastructure.Data;

namespace ToDoListBDD.API.Application.Handlers;

public class ClearCompletedTasksCommandHandler : IRequestHandler<ClearCompletedTasksCommand, ClearCompletedTasksResponse>
{
    private readonly ApplicationDbContext _context;

    public ClearCompletedTasksCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ClearCompletedTasksResponse> Handle(ClearCompletedTasksCommand request, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // 查詢所有已完成的任務
            var completedTasks = await _context.Tasks
                .Where(t => t.IsCompleted)
                .ToListAsync(cancellationToken);

            if (!completedTasks.Any())
            {
                await transaction.CommitAsync(cancellationToken);
                return new ClearCompletedTasksResponse
                {
                    DeletedCount = 0,
                    Message = "沒有已完成任務需要清除",
                    DeletedTasks = new List<TaskDto>()
                };
            }

            // 將要刪除的任務轉換為 DTO（用於 Undo 功能）
            var deletedTasksDto = completedTasks.Select(t => new TaskDto
            {
                Id = t.Id,
                Description = t.Description,
                IsCompleted = t.IsCompleted,
                CreatedAt = t.CreatedAt
            }).ToList();

            // 批量刪除已完成任務
            _context.Tasks.RemoveRange(completedTasks);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new ClearCompletedTasksResponse
            {
                DeletedCount = completedTasks.Count,
                Message = $"已清除 {completedTasks.Count} 個已完成任務",
                DeletedTasks = deletedTasksDto
            };
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}