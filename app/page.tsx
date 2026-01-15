export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Welcome to PostRoc
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Composable API data & request orchestration platform
        </p>
        <div className="pt-8 space-y-2 text-left">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get started by creating a workspace from the sidebar.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Then organize your API requests with Projects, Categories, and Customs.
          </p>
        </div>
      </div>
    </div>
  );
}
