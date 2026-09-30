<template>
  <div class="lg:p-0 p-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">
          {{ t('nav.users') }}
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          {{ t('adminUsers.count', { n: users.length }) }}
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="exportCsv"
          class="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Download class="w-4 h-4" />
          CSV
        </button>
        <button
          @click="openAdd"
          class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus class="w-4 h-4" />
          {{ t('adminUsers.add') }}
        </button>
      </div>
    </div>

    <!-- Search + Filter -->
    <div class="flex flex-col sm:flex-row gap-3 mb-5">
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          :placeholder="t('adminUsers.searchPlaceholder')"
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>
      <div class="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-auto sm:self-start">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          @click="roleFilter = tab.key"
          :class="[
            'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            roleFilter === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <SkeletonTable v-if="loading" :rows="6" :cols="6" />

    <template v-else>
      <EmptyState
        v-if="filtered.length === 0"
        :title="t('adminUsers.emptyTitle')"
        :description="t('adminUsers.emptyDesc')"
      >
        <template #icon>
          <Users class="w-8 h-8 text-slate-400" />
        </template>
      </EmptyState>

      <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 text-xs text-slate-500">
          {{ t('adminUsers.results', { n: filtered.length }) }}
        </div>
        <div class="divide-y divide-slate-100 sm:hidden">
          <article
              v-for="user in filtered"
              :key="user.id"
              :class="['p-4', !user.active && 'opacity-60']"
          >
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                <img
                    v-if="mediaUrl(user.avatarUrl)"
                    :src="mediaUrl(user.avatarUrl)!"
                    class="h-full w-full object-cover"
                    :alt="personName(user, user.login)"
                />
                <ShieldCheck
                    v-else-if="isAdmin(user)"
                    class="h-4 w-4 text-red-500"
                />
                <Building2
                    v-else-if="user.businessOwner"
                    class="h-4 w-4 text-violet-500"
                />
                <Users v-else class="h-4 w-4 text-slate-400" />
              </div>
              <button
                  class="min-w-0 flex-1 text-left"
                  @click="openUser(user)"
              >
                <p class="truncate text-sm font-semibold text-slate-800">
                  {{ personName(user) }}
                </p>
                <p class="truncate text-xs text-slate-500">
                  {{ user.login }} · {{ user.phone || t('adminUsers.noPhone') }}
                </p>
              </button>
              <button
                  :disabled="togglingId === user.id"
                  @click="activeConfirm = user"
                  :aria-label="user.active ? t('adminUsers.block') : t('adminUsers.activate')"
                  class="shrink-0"
              >
                <ToggleRight
                    v-if="user.active"
                    class="h-7 w-7 text-emerald-500"
                />
                <ToggleLeft
                    v-else
                    class="h-7 w-7 text-slate-300"
                />
              </button>
            </div>
            <div
                class="mt-3 flex items-center justify-between gap-2"
            >
              <span
                  :class="[
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                       roleColor(user)
                       ]"
              >
                {{ roleLabel(user) }}
              </span>
              <div class="flex gap-1">
                <button
                    v-if="!isAdmin(user)"
                    :disabled="togglingId === user.id"
                    @click="adminConfirm = { user, wasAdmin: false }"
                    class="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500"
                >
                  + Admin
                </button>
                <button
                    v-else
                    :disabled="togglingId === user.id"
                    @click="adminConfirm = { user, wasAdmin: true }"
                    class="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600"
                >
                  − Admin
                </button>
                <button
                    @click="openEdit(user)"
                    class="rounded-lg p-1.5 text-primary-600"
                >
                  <Edit2 class="h-4 w-4" />
                </button>
                <button
                    @click="deleteConfirm = user.id"
                    class="rounded-lg p-1.5 text-red-600"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        </div>
        <div class="hidden max-h-[700px] overflow-x-auto overflow-y-auto sm:block">
          <table class="w-full text-xs">
            <thead>
              <tr class="sticky z-30 top-0 bg-white border-b border-gray-50 shadow-sm text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
                <th class="px-5 py-3 text-center font-medium">№</th>
                <th class="px-5 py-3 text-left font-medium">{{ t('adminUsers.colUser') }}</th>
                <th class="px-5 py-3 text-left font-medium">{{ t('adminUsers.colLogin') }}</th>
                <th class="px-5 py-3 text-left font-medium">{{ t('adminUsers.colPhone') }}</th>
                <th class="px-5 py-3 text-left font-medium">{{ t('adminUsers.colRole') }}</th>
                <th class="px-5 py-3 text-center font-medium">{{ t('adminUsers.colActive') }}</th>
                <th class="px-5 py-3 text-right font-medium">{{ t('adminUsers.colActions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr
                v-for="(user, index) in filtered"
                :key="user.id"
                :class="[
                  'cursor-pointer transition-colors hover:bg-slate-50/80 focus-within:bg-slate-50',
                  !user.active && 'opacity-60',
                ]"
                tabindex="0"
                @click="openUser(user)"
                @keydown.enter="openUser(user)"
              >
                <td class="px-5 text-center py-3">{{index + 1}}</td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img
                        v-if="mediaUrl(user.avatarUrl)"
                        :src="mediaUrl(user.avatarUrl)!"
                        class="w-full h-full object-cover"
                        :alt="personName(user, user.login)"
                      />
                      <template v-else>
                        <ShieldCheck
                            v-if="isAdmin(user)"
                            class="w-4 h-4 text-red-500"
                        />
                        <Building2
                            v-else-if="user.businessOwner"
                            class="w-4 h-4 text-violet-500"
                        />
                        <Users
                            v-else
                            class="w-4 h-4 text-slate-400"
                        />
                      </template>
                    </div>
                    <div>
                      <p class="font-medium text-slate-800">{{ personName(user) }}</p>
                      <p class="text-xs text-slate-400">{{ user.email || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-slate-600 font-mono text-xs">{{ user.login }}</td>
                <td class="px-5 py-3.5 text-slate-500">{{ user.phone || '—' }}</td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span :class="[
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                         roleColor(user)
                         ]"
                    >
                      {{ roleLabel(user) }}
                    </span>
                    <button
                      v-if="!isAdmin(user)"
                      :disabled="togglingId === user.id"
                      @click.stop="adminConfirm = { user, wasAdmin: false }"
                      :title="t('adminUsers.makeAdmin')"
                      class="text-xs px-2 py-0.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      +Admin
                    </button>
                    <button
                      v-else
                      :disabled="togglingId === user.id"
                      @click.stop="adminConfirm = { user, wasAdmin: true }"
                      :title="t('adminUsers.revokeAdmin')"
                      class="text-xs px-2 py-0.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      −Admin
                    </button>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <button
                    :disabled="togglingId === user.id"
                    @click.stop="activeConfirm = user"
                    :title="user.active ? t('adminUsers.block') : t('adminUsers.activate')"
                    class="inline-flex items-center justify-center transition-opacity disabled:opacity-40"
                  >
                    <ToggleRight
                        v-if="user.active"
                        class="w-7 h-7 text-emerald-500"
                    />
                    <ToggleLeft
                        v-else
                        class="w-7 h-7 text-slate-300"
                    />
                  </button>
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      @click.stop="openEdit(user)"
                      :title="t('common.edit')"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      @click.stop="deleteConfirm = user.id"
                      :title="t('common.delete')"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <AppModal
        v-if="showModal && !editingUser"
        :title="t('adminUsers.newUser')"
        @close="showModal = false"
    >
      <form
          @submit.prevent="save"
          class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.login') }}
            </label>
            <input
                v-model="createForm.login"
                type="text"
                placeholder="username"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.password') }}
            </label>
            <input
                v-model="createForm.password"
                type="password"
                :placeholder="t('adminUsers.min8')"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.firstNameReq') }}
            </label>
            <input
                v-model="createForm.firstName"
                type="text"
                :placeholder="t('adminUsers.firstName')"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.lastName') }}
            </label>
            <input
                v-model="createForm.lastName"
                type="text"
                :placeholder="t('adminUsers.lastName')"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.email') }}
            </label>
            <input
                v-model="createForm.email"
                type="email"
                placeholder="email@example.com"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.phone') }}
            </label>
            <input
                v-model="createForm.phone"
                type="tel"
                placeholder="+998901234567"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>

        <div class="flex gap-3 pt-1">
          <button type="button"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            @click="showModal = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
              type="submit"
              :disabled="saving || !createForm.login || !createForm.password || !createForm.firstName?.trim()"
              class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
            {{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </form>
    </AppModal>
    <AppModal
        v-if="showModal && editingUser"
        :title="t('adminUsers.editTitle', { login: editingUser.login })"
        @close="showModal = false"
    >
      <form
          @submit.prevent="save"
          class="space-y-4"
      >
        <div class="flex items-center gap-4 pb-2 border-b border-slate-100">
          <div class="relative w-16 h-16 flex-shrink-0">
            <img
                v-if="avatarPreview"
                :src="avatarPreview"
                alt=""
                class="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
            <div
                v-else
                class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200"
            >
              <Users class="w-7 h-7 text-slate-400" />
            </div>
            <label class="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <Camera class="w-3.5 h-3.5 text-white" />
              <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  @change="onAvatarChange"
              />
            </label>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-700">
              {{ personName(editingUser) }}
            </p>
            <p class="text-xs text-slate-400 mt-0.5">
              JPG, PNG, WEBP · max 5MB
            </p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.firstName') }}
            </label>
            <input
                v-model="editForm.firstName"
                type="text"
                :placeholder="t('adminUsers.firstName')"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.lastName') }}
            </label>
            <input
                v-model="editForm.lastName"
                type="text"
                :placeholder="t('adminUsers.lastName')"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.email') }}
            </label>
            <input
                v-model="editForm.email"
                type="email"
                placeholder="email@example.com"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">
              {{ t('adminUsers.phone') }}
            </label>
            <input
                v-model="editForm.phone"
                type="tel"
                placeholder="+998901234567"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('adminUsers.newPassword') }}
            <span class="text-slate-400 font-normal">
              {{ t('adminUsers.keepEmpty') }}
            </span>
          </label>
          <input
              v-model="editForm.password"
              type="password"
              :placeholder="t('adminUsers.min8')"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
        <div class="flex gap-3 pt-1">
          <button type="button"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            @click="showModal = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
              type="submit"
              :disabled="saving"
              class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
            {{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </form>
    </AppModal>
    <AppModal
      v-if="adminConfirm"
      :title="adminConfirm.wasAdmin ? t('adminUsers.revokeAdmin') : t('adminUsers.grantAdmin')"
      size="sm"
      @close="adminConfirm = null"
    >
      <i18n-t
          :keypath="adminConfirm.wasAdmin ? 'adminUsers.revokeConfirm' : 'adminUsers.grantConfirm'"
          tag="p"
          class="text-slate-600 text-sm mb-5"
      >
        <template #name>
          <span class="font-semibold">
            {{ personName(adminConfirm.user, adminConfirm.user.login) }}
          </span>
        </template>
      </i18n-t>
      <div class="flex gap-3">
        <button
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            @click="adminConfirm = null"
        >
          {{ t('common.cancel') }}
        </button>
        <button
            class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
            @click="confirmToggleAdmin"
        >
          {{ adminConfirm.wasAdmin ? t('adminUsers.revoke') : t('adminUsers.grant') }}
        </button>
      </div>
    </AppModal>
    <AppModal
      v-if="activeConfirm"
      :title="activeConfirm.active ? t('adminUsers.blockTitle') : t('adminUsers.activateTitle')"
      size="sm"
      @close="activeConfirm = null"
    >
      <i18n-t
          :keypath="activeConfirm.active ? 'adminUsers.blockConfirm' : 'adminUsers.activateConfirm'"
          tag="p"
          class="text-slate-600 text-sm mb-5"
      >
        <template #name>
          <span class="font-semibold">
            {{ personName(activeConfirm, activeConfirm.login) }}
          </span>
        </template>
      </i18n-t>
      <div class="flex gap-3">
        <button
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            @click="activeConfirm = null"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          class="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          :class="activeConfirm?.active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'"
          @click="confirmToggleActive"
        >
          {{ activeConfirm.active ? t('adminUsers.block') : t('adminUsers.activate') }}
        </button>
      </div>
    </AppModal>

    <ConfirmModal
      v-if="deleteConfirm"
      :title="t('adminUsers.deleteTitle')"
      :message="t('adminUsers.deleteMessage')"
      :confirm-label="t('common.delete')"
      icon="trash"
      variant="danger"
      @confirm="confirmDelete(deleteConfirm!)"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Search, Trash2, Edit2, Users, ShieldCheck, Building2, ToggleLeft, ToggleRight, Download, Camera } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { mediaUrl } from '@/utils/media'
import { usersApi } from '@/api/users'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { personName } from '@/utils/names'
import type { User, UserCreateRequest, UserUpdateRequest } from '@/types'
import { useI18n } from 'vue-i18n'
import { dateLocale } from '@/i18n'

const toast = useToast()
const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

const users = ref<User[]>([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const roleFilter = ref<'all' | 'admin' | 'owner' | 'user'>('all')
const showModal = ref(false)
const deleteConfirm = ref<string | null>(null)
const adminConfirm = ref<{ user: User; wasAdmin: boolean } | null>(null)
const activeConfirm = ref<User | null>(null)
const editingUser = ref<User | null>(null)
const togglingId = ref<string | null>(null)

interface CreateForm extends UserCreateRequest {
  password: string
  firstName: string
  lastName?: string
}

const defaultForm = (): CreateForm => ({
  login: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

const editForm = ref<UserUpdateRequest>({ firstName: '', lastName: '', email: '', phone: '', password: '' })
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const createForm = ref<CreateForm>(defaultForm())

const filtered = computed(() => {
  let list = users.value
  if (roleFilter.value === 'admin') list = list.filter(u => u.roles?.includes('ROLE_ADMIN'))
  else if (roleFilter.value === 'owner') list = list.filter(u => u.businessOwner && !u.roles?.includes('ROLE_ADMIN'))
  else if (roleFilter.value === 'user') list = list.filter(u => !u.businessOwner && !u.roles?.includes('ROLE_ADMIN'))
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(u =>
      u.login.toLowerCase().includes(q) ||
      personName(u, '').toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
  )
})

const filterTabs = computed<{ key: typeof roleFilter.value; label: string }[]>(() => [
  { key: 'all', label: t('adminUsers.tabAll') },
  { key: 'admin', label: t('adminUsers.tabAdmins') },
  { key: 'owner', label: t('adminUsers.tabOwners') },
  { key: 'user', label: t('adminUsers.tabUsers') },
])

function openAdd() {
  editingUser.value = null
  createForm.value = defaultForm()
  showModal.value = true
}

function openEdit(user: User) {
  editingUser.value = user
  editForm.value = {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    password: '',
  }
  avatarFile.value = null
  avatarPreview.value = mediaUrl(user.avatarUrl)
  showModal.value = true
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    toast.error(t('profile.imageType'))
    input.value = ''
    return
  }
  if (file.size > MAX_AVATAR_SIZE) {
    toast.error(t('common.imageSize'))
    input.value = ''
    return
  }
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function save() {
  saving.value = true
  try {
    if (editingUser.value) {
      const payload = { ...editForm.value }
      if (!payload.password) delete payload.password
      let { data } = await usersApi.update(editingUser.value.id, payload)
      if (avatarFile.value) {
        const res = await usersApi.uploadAvatar(editingUser.value.id, avatarFile.value)
        data = res.data
        // O'zining avatarini yangilagan bo'lsa header ham yangilansin
        if (editingUser.value.id === authStore.user?.userId) {
          authStore.updateAvatar(data.avatarUrl ?? null)
        }
      }
      const idx = users.value.findIndex(u => u.id === editingUser.value!.id)
      if (idx !== -1) users.value[idx] = data
    } else {
      const payload = { ...createForm.value }
      const { data } = await usersApi.create(payload)
      users.value.unshift(data)
    }
    showModal.value = false
    toast.success(t('common.saved'))
  } catch {
    toast.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

async function confirmToggleActive() {
  const user = activeConfirm.value
  if (!user) return
  activeConfirm.value = null
  togglingId.value = user.id
  try {
    const { data } = await usersApi.update(user.id, { active: !user.active })
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = data
    toast.success(data.active ? t('adminUsers.activated') : t('adminUsers.blocked'))
  } catch {
    toast.error(t('common.error'))
  } finally {
    togglingId.value = null
  }
}

async function confirmToggleAdmin() {
  const item = adminConfirm.value
  if (!item) return
  adminConfirm.value = null
  const { user, wasAdmin } = item
  togglingId.value = user.id
  try {
    const newRoles = wasAdmin
        ? (user.roles ?? []).filter(r => r !== 'ROLE_ADMIN')
        : [...(user.roles ?? []), 'ROLE_ADMIN']
    const { data } = await usersApi.update(user.id, { roles: newRoles })
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = data
    toast.success(wasAdmin ? t('adminUsers.adminRevoked') : t('adminUsers.adminGranted'))
  } catch {
    toast.error(t('common.error'))
  } finally {
    togglingId.value = null
  }
}

async function confirmDelete(id: string) {
  try {
    await usersApi.delete(id)
    users.value = users.value.filter(u => u.id !== id)
    deleteConfirm.value = null
    toast.success(t('adminUsers.deleted'))
  } catch {
    toast.error(t('common.error'))
  }
}

function isAdmin(user: User) {
  return user.roles?.includes('ROLE_ADMIN') ?? false
}

function roleLabel(user: User) {
  if (isAdmin(user)) return t('roles.ROLE_ADMIN')
  if (user.roles?.includes('ROLE_BUSINESS_OWNER') || user.businessOwner) return t('roles.ROLE_BUSINESS_OWNER')
  if (user.roles?.includes('ROLE_MANAGER')) return t('roles.ROLE_MANAGER')
  return t('roles.ROLE_USER')
}

function roleColor(user: User) {
  if (isAdmin(user)) return 'bg-red-100 text-red-700'
  if (user.roles?.includes('ROLE_BUSINESS_OWNER') || user.businessOwner) return 'bg-violet-100 text-violet-700'
  if (user.roles?.includes('ROLE_MANAGER')) return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}

function openUser(user: User) {
  router.push(`/admin/users/${user.id}`)
}

function exportCsv() {
  const rows = [
    ['ID', t('adminUsers.colLogin'), t('adminUsers.firstName'), t('adminUsers.email'), t('adminUsers.phone'), t('adminUsers.colRole'), t('adminUsers.colActive'), t('adminUsers.registered')],
    ...filtered.value.map(u => [
      u.id,
      u.login,
      personName(u, ''),
      u.email ?? '',
      u.phone ?? '',
      roleLabel(u),
      u.active ? t('common.yes') : t('common.no'),
      new Date(u.createdAt).toLocaleDateString(dateLocale()),
    ]),
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `foydalanuvchilar_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  try {
    const { data } = await usersApi.getAll()
    users.value = data
  } finally {
    loading.value = false
  }
})
</script>
