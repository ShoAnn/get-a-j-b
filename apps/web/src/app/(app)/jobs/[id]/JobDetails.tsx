export default function JobDetails() {
    const params = useParams();
    const job = MOCK_JOBS.find((j) => j.id === params.id);

}
