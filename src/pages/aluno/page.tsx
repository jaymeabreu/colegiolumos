<div className="sticky top-20 z-40 border-b bg-card px-6 flex-shrink-0">
      <nav className="flex space-x-8 py-0">
        {tabsConfig.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-fast ${
              activeTab === id
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>

    <main className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6">
          <ErrorBoundary>
            {renderTabContent()}
          </ErrorBoundary>
        </div>
      </ScrollArea>
    </main>
  </div>
</ErrorBoundary>
