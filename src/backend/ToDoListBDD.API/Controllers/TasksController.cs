using Microsoft.AspNetCore.Mvc;
using MediatR;
using ToDoListBDD.API.ApplicationCommands;
using ToDoListBDD.API.ApplicationQueries;
using ToDoListBDD.API.ApplicationDTOs;
using FluentValidation;

namespace ToDoListBDD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateTaskCommand> _createValidator;
    private readonly IValidator<UpdateTaskStatusCommand> _updateValidator;
    private readonly IValidator<UpdateTaskDescriptionCommand> _updateDescriptionValidator;
    private readonly IValidator<DeleteTaskCommand> _deleteValidator;

    public TasksController(IMediator mediator,
        IValidator<CreateTaskCommand> createValidator,
        IValidator<UpdateTaskStatusCommand> updateValidator,
        IValidator<UpdateTaskDescriptionCommand> updateDescriptionValidator,
        IValidator<DeleteTaskCommand> deleteValidator)
    {
        _mediator = mediator;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _updateDescriptionValidator = updateDescriptionValidator;
        _deleteValidator = deleteValidator;
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> CreateTask([FromBody] CreateTaskCommand command)
    {
        try
        {
            // 驗證命令
            var validationResult = await _createValidator.ValidateAsync(command);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { Errors = errors, Message = string.Join(", ", errors) });
            }

            // 執行命令
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetTask), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "伺服器發生錯誤", Error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<TaskDto>>> GetTasks([FromQuery] string? status = null)
    {
        try
        {
            var query = new GetTasksQuery { Status = status };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "伺服器發生錯誤", Error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public Task<ActionResult<TaskDto>> GetTask(int id)
    {
        // 暫時實作，後續會加入查詢功能
        return Task.FromResult<ActionResult<TaskDto>>(NotFound());
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<TaskDto>> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusRequest request)
    {
        try
        {
            var command = new UpdateTaskStatusCommand
            {
                TaskId = id,
                IsCompleted = request.IsCompleted
            };

            // 驗證命令
            var validationResult = await _updateValidator.ValidateAsync(command);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { Errors = errors, Message = string.Join(", ", errors) });
            }

            // 執行命令
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "伺服器發生錯誤", Error = ex.Message });
        }
    }

    [HttpPatch("{id}/description")]
    public async Task<ActionResult<TaskDto>> UpdateTaskDescription(int id, [FromBody] UpdateTaskDescriptionRequest request)
    {
        try
        {
            var command = new UpdateTaskDescriptionCommand
            {
                TaskId = id,
                Description = request.Description
            };

            // 驗證命令
            var validationResult = await _updateDescriptionValidator.ValidateAsync(command);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { Errors = errors, Message = string.Join(", ", errors) });
            }

            // 執行命令
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "伺服器發生錯誤", Error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTask(int id)
    {
        try
        {
            var command = new DeleteTaskCommand { TaskId = id };

            // 驗證命令
            var validationResult = await _deleteValidator.ValidateAsync(command);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { Errors = errors, Message = string.Join(", ", errors) });
            }

            // 執行命令
            var result = await _mediator.Send(command);
            if (result)
                return NoContent(); // 204 - 成功刪除
            else
                return NotFound($"找不到 ID 為 {id} 的任務");
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "刪除任務時發生內部錯誤", Error = ex.Message });
        }
    }
}