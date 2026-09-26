enum AiProvider {
  openAi(
    id: 'openai',
    displayName: 'OpenAI',
    models: ['gpt-6-luna', 'gpt-6-sol', 'gpt-6-astra', 'gpt-5.4-mini'],
    defaultModel: 'gpt-6-luna',
  ),
  googleAiStudio(
    id: 'google_ai_studio',
    displayName: 'Google AI Studio',
    models: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite'],
    defaultModel: 'gemini-3.8-flash',
  );

  const AiProvider({
    required this.id,
    required this.displayName,
    required this.models,
    required this.defaultModel,
  });

  final String id;
  final String displayName;
  final List<String> models;
  final String defaultModel;

  static AiProvider parse(String? value) => values.firstWhere(
    (provider) => provider.id == value,
    orElse: () => AiProvider.openAi,
  );
}
