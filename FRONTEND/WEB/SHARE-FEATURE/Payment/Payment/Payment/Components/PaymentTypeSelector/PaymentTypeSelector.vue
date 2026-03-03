<template>
  <div class="payment-type-selector">
    <div class="selector-header">
      <div class="dropdown-container" ref="dropdownRef">
        <div class="selected-type" @click="toggleDropdown">
          <span class="type-text">{{ selectedTypeLabel }}</span>
          <v-icon :class="{ 'rotated': showDropdown }">mdi-chevron-down</v-icon>
        </div>
        
        <transition name="dropdown-fade">
          <div v-if="showDropdown" class="dropdown-menu">
            <div
              v-for="type in paymentTypes"
              :key="type.value"
              class="dropdown-item"
              :class="{ active: selectedType === type.value }"
              @click="selectType(type)"
            >
              <v-icon class="item-icon">{{ type.icon }}</v-icon>
              <span>{{ type.label }}</span>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script src="./PaymentTypeSelector.js"></script>
<style scoped src="./PaymentTypeSelector.css"></style>
