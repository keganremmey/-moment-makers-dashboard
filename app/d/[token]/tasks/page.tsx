import { notFound } from "next/navigation";
import { getClientByToken, getTasks, type Task } from "@/lib/data";
import { TaskCheckbox } from "@/components/TaskCheckbox";

function TaskGroup({
  title,
  tasks,
  token,
  emptyLabel,
  flagged,
}: {
  title: string;
  tasks: Task[];
  token: string;
  emptyLabel: string;
  flagged?: boolean;
}) {
  return (
    <section className="card p-5">
      <p className="label">{title}</p>
      {tasks.length === 0 ? (
        <p className="mt-3 text-base text-ink-dim">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-start gap-3 border-b border-paper-line pb-3 last:border-none last:pb-0 ${
                flagged ? "text-lacquer" : "text-ink"
              }`}
            >
              <TaskCheckbox
                taskId={task.id}
                token={token}
                done={task.status === "done"}
              />
              <div>
                <p className="text-base leading-snug">{task.title}</p>
                {task.note && (
                  <p className="mt-1 text-sm text-ink-dim">{task.note}</p>
                )}
                {task.assigned_date && (
                  <p className="mt-1 text-xs text-ink-dim">
                    Assigned {task.assigned_date}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function TasksPage(props: PageProps<"/d/[token]/tasks">) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const tasks = await getTasks(client.id);
  const open = tasks.filter((t) => t.status === "open");
  const slipped = tasks.filter((t) => t.status === "slipped");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="flex flex-col gap-6">
      <TaskGroup
        title="Slipped, needs a look"
        tasks={slipped}
        token={token}
        emptyLabel="Nothing slipped right now."
        flagged
      />
      <TaskGroup
        title="Open"
        tasks={open}
        token={token}
        emptyLabel="No open tasks."
      />
      <TaskGroup
        title="Done"
        tasks={done}
        token={token}
        emptyLabel="Nothing marked done yet."
      />
    </div>
  );
}
