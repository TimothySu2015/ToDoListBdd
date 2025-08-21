using FluentValidation;
using ToDoListBDD.API.ApplicationCommands;

namespace ToDoListBDD.API.Application.Validators;

public class DeleteTaskCommandValidator : AbstractValidator<DeleteTaskCommand>
{
    public DeleteTaskCommandValidator()
    {
        RuleFor(x => x.TaskId)
            .GreaterThan(0).WithMessage("任務 ID 必須大於 0");
    }
}