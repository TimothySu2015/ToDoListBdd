using MediatR;
using ToDoListBDD.API.ApplicationDTOs;

namespace ToDoListBDD.API.ApplicationQueries;

public class GetTasksQuery : IRequest<List<TaskDto>>
{
    public string? Status { get; set; } // null = all, "todo" = false, "completed" = true
    public string? Search { get; set; } // 搜尋關鍵字
}