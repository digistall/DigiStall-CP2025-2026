<template>
  <v-card class="ai-card" elevation="0">
    <v-card-title class="ai-header">
      <div class="ai-title-wrapper">
        <div class="ai-icon">
          <v-icon color="white" size="20">mdi-robot-outline</v-icon>
        </div>
        <div>
          <h3 class="ai-title">AI Business Insights</h3>
          <p class="ai-subtitle">Powered by AI analysis</p>
        </div>
      </div>
      <v-btn 
        icon 
        variant="text" 
        size="small" 
        @click="refreshSuggestions"
        :loading="loading"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-card-title>
    
    <v-card-text class="ai-body">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
        <p>Analyzing your business data...</p>
      </div>
      
      <!-- Suggestions List -->
      <div v-else class="suggestions-list">
        <div 
          v-for="(suggestion, index) in suggestions" 
          :key="index" 
          class="suggestion-item"
          :class="suggestion.type"
        >
          <div class="suggestion-icon" :class="suggestion.type">
            <v-icon size="18" color="white">{{ getIcon(suggestion.type) }}</v-icon>
          </div>
          <div class="suggestion-content">
            <h4 class="suggestion-title">{{ suggestion.title }}</h4>
            <p class="suggestion-text">{{ suggestion.message }}</p>
            <div class="suggestion-meta" v-if="suggestion.metric">
              <v-chip size="x-small" :color="getChipColor(suggestion.type)" variant="tonal">
                {{ suggestion.metric }}
              </v-chip>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Chat Input -->
      <div class="ai-chat-section">
        <div class="chat-divider">
          <span>Ask AI for more insights</span>
        </div>
        <div class="chat-input-wrapper">
          <v-text-field
            v-model="userQuestion"
            placeholder="Ask about your business performance..."
            variant="outlined"
            density="compact"
            hide-details
            @keyup.enter="askAI"
            :loading="askLoading"
          >
            <template v-slot:append-inner>
              <v-btn 
                icon 
                size="small" 
                variant="text" 
                @click="askAI"
                :disabled="!userQuestion.trim() || askLoading"
              >
                <v-icon>mdi-send</v-icon>
              </v-btn>
            </template>
          </v-text-field>
        </div>
        
        <!-- AI Response -->
        <div v-if="aiResponse" class="ai-response">
          <div class="response-header">
            <v-icon size="16" color="primary">mdi-robot</v-icon>
            <span>AI Response</span>
          </div>
          <p class="response-text">{{ aiResponse }}</p>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'AISuggestions',
  props: {
    dashboardStats: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      loading: false,
      askLoading: false,
      userQuestion: '',
      aiResponse: '',
      suggestions: []
    }
  },
  watch: {
    dashboardStats: {
      handler() {
        this.generateSuggestions()
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.generateSuggestions()
  },
  methods: {
    getIcon(type) {
      const icons = {
        success: 'mdi-trending-up',
        warning: 'mdi-alert-outline',
        info: 'mdi-lightbulb-outline',
        action: 'mdi-rocket-launch-outline'
      }
      return icons[type] || 'mdi-information-outline'
    },
    getChipColor(type) {
      const colors = {
        success: 'success',
        warning: 'warning',
        info: 'info',
        action: 'primary'
      }
      return colors[type] || 'grey'
    },
    generateSuggestions() {
      const stats = this.dashboardStats
      const suggestions = []
      
      // Analyze expiring subscriptions
      if (stats.expiringSoon > 0) {
        suggestions.push({
          type: 'warning',
          title: 'Subscriptions Expiring Soon',
          message: `${stats.expiringSoon} subscription${stats.expiringSoon > 1 ? 's are' : ' is'} expiring within 30 days. Consider sending renewal reminders to retain these customers.`,
          metric: `${stats.expiringSoon} at risk`
        })
      }
      
      // Analyze revenue
      if (stats.totalRevenue > 0) {
        const avgRevenue = stats.totalRevenue / Math.max(stats.activeSubscriptions || 1, 1)
        if (avgRevenue < 8000) {
          suggestions.push({
            type: 'action',
            title: 'Upselling Opportunity',
            message: 'Average revenue per user is below ₱8,000. Consider promoting Premium plans with AI features to increase ARPU.',
            metric: `₱${Math.round(avgRevenue).toLocaleString()} avg/user`
          })
        }
      }
      
      // Analyze growth
      if (stats.totalBusinessOwners > 0 && stats.activeSubscriptions > 0) {
        const conversionRate = (stats.activeSubscriptions / stats.totalBusinessOwners) * 100
        if (conversionRate >= 80) {
          suggestions.push({
            type: 'success',
            title: 'Strong Conversion Rate',
            message: `${Math.round(conversionRate)}% of registered business owners have active subscriptions. Your platform has excellent engagement!`,
            metric: `${Math.round(conversionRate)}% active`
          })
        } else {
          suggestions.push({
            type: 'info',
            title: 'Conversion Opportunity',
            message: `${Math.round(100 - conversionRate)}% of registered users don't have active subscriptions. Consider targeted email campaigns.`,
            metric: `${Math.round(conversionRate)}% converted`
          })
        }
      }
      
      // Pending payments insight
      if (stats.pendingPayments > 0) {
        suggestions.push({
          type: 'warning',
          title: 'Pending Payments',
          message: `${stats.pendingPayments} payment${stats.pendingPayments > 1 ? 's are' : ' is'} pending. Follow up to ensure smooth cash flow.`,
          metric: `${stats.pendingPayments} pending`
        })
      }
      
      // Revenue growth suggestion
      if (stats.revenueThisMonth > 0) {
        suggestions.push({
          type: 'success',
          title: 'Monthly Revenue',
          message: `This month's revenue is ₱${parseFloat(stats.revenueThisMonth).toLocaleString()}. Keep the momentum going!`,
          metric: `₱${parseFloat(stats.revenueThisMonth).toLocaleString()}`
        })
      }
      
      // Default suggestion if no data
      if (suggestions.length === 0) {
        suggestions.push({
          type: 'info',
          title: 'Getting Started',
          message: 'Welcome to your AI-powered dashboard! As your business grows, I\'ll provide personalized insights and recommendations here.',
          metric: 'AI Ready'
        })
      }
      
      this.suggestions = suggestions.slice(0, 4) // Limit to 4 suggestions
    },
    refreshSuggestions() {
      this.loading = true
      setTimeout(() => {
        this.generateSuggestions()
        this.loading = false
      }, 1000)
    },
    async askAI() {
      if (!this.userQuestion.trim()) return
      
      this.askLoading = true
      const question = this.userQuestion
      
      try {
        // Generate contextual response based on dashboard data
        const response = await this.generateAIResponse(question)
        this.aiResponse = response
        this.userQuestion = ''
      } catch (error) {
        console.error('AI Error:', error)
        this.aiResponse = 'I apologize, but I encountered an issue processing your request. Please try again.'
      } finally {
        this.askLoading = false
      }
    },
    async generateAIResponse(question) {
      const stats = this.dashboardStats
      const questionLower = question.toLowerCase()
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Context-aware responses based on keywords
      if (questionLower.includes('revenue') || questionLower.includes('money') || questionLower.includes('income')) {
        const total = stats.totalRevenue || 0
        const monthly = stats.revenueThisMonth || 0
        return `Based on your current data, your total revenue is ₱${parseFloat(total).toLocaleString()} with ₱${parseFloat(monthly).toLocaleString()} earned this month. To increase revenue, I recommend: 1) Focus on converting trial users to paid plans, 2) Promote the Premium plan with AI features, and 3) Implement referral incentives for existing customers.`
      }
      
      if (questionLower.includes('subscription') || questionLower.includes('plan')) {
        const active = stats.activeSubscriptions || 0
        const expiring = stats.expiringSoon || 0
        return `You currently have ${active} active subscription${active !== 1 ? 's' : ''} with ${expiring} expiring soon. My recommendation: Send personalized renewal emails 14 days before expiry, offer loyalty discounts for annual renewals, and highlight new features in the Premium plan.`
      }
      
      if (questionLower.includes('customer') || questionLower.includes('business owner') || questionLower.includes('user')) {
        const total = stats.totalBusinessOwners || 0
        return `You have ${total} registered business owner${total !== 1 ? 's' : ''} on the platform. To grow your customer base: 1) Leverage social proof with testimonials, 2) Offer a compelling free trial, 3) Partner with local business associations, and 4) Create educational content about stall management.`
      }
      
      if (questionLower.includes('improve') || questionLower.includes('suggestion') || questionLower.includes('recommendation')) {
        return `Here are my top recommendations for platform improvement: 1) Implement automated renewal reminders, 2) Add a customer feedback system, 3) Create tiered loyalty rewards, 4) Develop mobile app notifications for important updates, and 5) Offer bundled services for higher-tier plans.`
      }
      
      if (questionLower.includes('growth') || questionLower.includes('expand')) {
        return `For sustainable growth, focus on: 1) Customer retention (cheaper than acquisition), 2) Upselling existing customers to higher plans, 3) Building strategic partnerships, 4) Investing in content marketing, and 5) Implementing a referral program with meaningful incentives.`
      }
      
      // Default intelligent response
      return `Based on your dashboard data with ${stats.totalBusinessOwners || 0} business owners and ${stats.activeSubscriptions || 0} active subscriptions, your platform shows good engagement. Focus on reducing churn, increasing average revenue per user, and maintaining high customer satisfaction. Feel free to ask me specific questions about revenue, subscriptions, or growth strategies!`
    }
  }
}
</script>

<style scoped>
.ai-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  height: 100%;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.ai-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #002181 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(0, 33, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(0, 33, 129, 0);
  }
}

.ai-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.ai-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.ai-body {
  padding: 16px 24px 24px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 16px;
}

.loading-state p {
  color: #6b7280;
  font-size: 14px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.suggestion-item:hover {
  border-color: rgba(0, 33, 129, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.suggestion-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.suggestion-icon.success {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.suggestion-icon.warning {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
}

.suggestion-icon.info {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
}

.suggestion-icon.action {
  background: linear-gradient(135deg, #002181 0%, #1565c0 100%);
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.suggestion-text {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.suggestion-meta {
  margin-top: 8px;
}

/* AI Chat Section */
.ai-chat-section {
  margin-top: 20px;
}

.chat-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.chat-divider::before,
.chat-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
}

.chat-divider span {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

.chat-input-wrapper {
  margin-bottom: 12px;
}

.ai-response {
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.04) 0%, rgba(124, 58, 237, 0.04) 100%);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(0, 33, 129, 0.08);
}

.response-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #002181;
}

.response-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}
</style>
