export default function ResultPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-2xl font-semibold text-[#111827]">
        Result {params.id}
      </h1>
    </div>
  );
}
