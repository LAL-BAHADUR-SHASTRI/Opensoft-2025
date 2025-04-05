const AppLoader=()=> {
  return (
    <div className="flex items-center justify-center h-screen bg-neutral-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        <div className="absolute text-white text-lg">Loading...</div>
    </div>
  )
}

export default AppLoader;