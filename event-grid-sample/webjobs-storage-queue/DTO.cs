#nullable disable

public class EncodingJobMessage
{
    public string id { get; set; }
    public string EventType { get; set; }
    public string Subject { get; set; }

    public JobData Data { get; set; }

    // Experiment whether it will break queue reading
    public string SomeNotExistingProperty { get; set; }
}

public class JobData
{
    public string State { get; set; }

    public JobOutput Output { get; set; }
}

public class JobOutput
{
    public string State { get; set; }

    public int Progress { get; set; }

    public string Error { get; set; }
}