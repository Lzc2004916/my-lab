<template>
  <div class="flex flex-col min-h-dvh bg-base-200">
    <!-- Navbar -->
    <div class="navbar bg-base-100 border-b border-base-300/60 min-h-0 py-0 h-12">
      <div class="navbar-start">
        <div class="dropdown">
          <label tabindex="0" class="btn btn-ghost btn-sm lg:hidden h-8 w-8 min-h-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><router-link :to="{ name: 'home' }">首页</router-link></li>
            <li><router-link :to="{ name: 'editor' }">编辑器</router-link></li>
          </ul>
        </div>
        <router-link :to="{ name: 'home' }" class="btn btn-ghost text-lg tracking-tight h-8 min-h-0">
          <span class="text-primary font-bold">{{ appStore.title }}</span>
        </router-link>
      </div>
      <div class="navbar-center hidden lg:flex">
        <ul class="flex items-center gap-1 px-1">
          <li>
            <router-link
              :to="{ name: 'home' }"
              class="px-3 py-1.5 text-sm rounded-md transition-colors leading-none"
              :class="$route.name === 'home' ? 'text-base-content font-medium bg-base-200/80' : 'text-base-content/60 hover:text-base-content hover:bg-base-200/40'"
            >
              首页
            </router-link>
          </li>
          <li>
            <router-link
              :to="{ name: 'editor' }"
              class="px-3 py-1.5 text-sm rounded-md transition-colors leading-none"
              :class="$route.name === 'editor' ? 'text-base-content font-medium bg-base-200/80' : 'text-base-content/60 hover:text-base-content hover:bg-base-200/40'"
            >
              编辑器
            </router-link>
          </li>
        </ul>
      </div>
      <div class="navbar-end"></div>
    </div>

    <!-- Main Content -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="footer footer-center p-3 bg-base-100/60 text-base-content/30 border-t border-base-300/60 text-xs">
      <aside>
        <p>Rich Text Editor &mdash; Built with Electron + Vue 3</p>
      </aside>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>
