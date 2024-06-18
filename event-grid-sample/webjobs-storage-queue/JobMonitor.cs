using Microsoft.Azure.WebJobs;

public class JobMonitor
{
    public static string? Subject { get; set; }

    public static Task ProcessQueeuMessage([QueueTrigger("%JobMonitoringQueueName%")] EncodingJobMessage jobTask)
    {
        if (!string.IsNullOrEmpty(Subject) && jobTask.Subject != Subject)
        {
            return Task.CompletedTask;
        }
    
        if (jobTask.EventType.Equals("Microsoft.Media.JobStateChange"))
        {
            Console.WriteLine($"Job {jobTask.id} state changed: {jobTask.Data.State}");
        }
        else if (jobTask.EventType.Equals("Microsoft.Media.JobOutputStateChange"))
        {
            Console.WriteLine($"Job {jobTask.id} output state changed: {jobTask.Data.Output.State}, progress: {jobTask.Data.Output.Progress}");
        }

        return Task.CompletedTask;
    }
}