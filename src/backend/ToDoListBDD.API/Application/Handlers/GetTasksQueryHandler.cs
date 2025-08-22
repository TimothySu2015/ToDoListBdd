using MediatR;
using Microsoft.EntityFrameworkCore;
using ToDoListBDD.API.ApplicationQueries;
using ToDoListBDD.API.ApplicationDTOs;
using ToDoListBDD.API.Infrastructure.Data;

namespace ToDoListBDD.API.Application.Handlers;

public class GetTasksQueryHandler : IRequestHandler<GetTasksQuery, List<TaskDto>>
{
    private readonly ApplicationDbContext _context;

    public GetTasksQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaskDto>> Handle(GetTasksQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Tasks.AsQueryable();

        // 根據狀態篩選
        if (!string.IsNullOrEmpty(request.Status))
        {
            if (request.Status.ToLower() == "todo")
            {
                query = query.Where(t => !t.IsCompleted);
            }
            else if (request.Status.ToLower() == "completed")
            {
                query = query.Where(t => t.IsCompleted);
            }
            // "all" 或其他值則不篩選，返回所有任務
        }

        // 根據搜尋關鍵字篩選
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = request.Search.Trim().ToLower();
            query = query.Where(t => EF.Functions.Like(t.Description.ToLower(), $"%{searchTerm}%"));
        }

        return await query
            .OrderBy(t => t.CreatedAt)
            .Select(t => new TaskDto
            {
                Id = t.Id,
                Description = t.Description,
                IsCompleted = t.IsCompleted,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}