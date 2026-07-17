// ═══════════════════════════════════════════════════════════════════════════
// SearchDialog 组件 — 单元测试
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchDialog from '../SearchDialog.vue'

// ── Mount helper ───────────────────────────────────────────────────────

function mountDialog(visible = true): VueWrapper<InstanceType<typeof SearchDialog>> {
  return mount(SearchDialog, {
    props: { visible },
    global: {
      stubs: {
        // 让 Teleport 在原地渲染，Transition 立即渲染子内容
        teleport: true,
        transition: true,
      },
    },
    attachTo: document.body,
  })
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('SearchDialog', () => {
  let wrapper: VueWrapper<InstanceType<typeof SearchDialog>>

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('渲染', () => {
    it('visible=true 时显示弹窗', async () => {
      wrapper = mountDialog(true)
      await nextTick()
      // Transition stub + Teleport=false — 内容应直接渲染
      expect(wrapper.html()).toContain('search-dialog')
    })

    it('visible=false 时不应显示弹窗', async () => {
      wrapper = mountDialog(false)
      await nextTick()
      expect(wrapper.html()).not.toContain('search-dialog')
    })

    it('应渲染搜索输入框', async () => {
      wrapper = mountDialog(true)
      await nextTick()
      const input = wrapper.find('input.search-input')
      expect(input.exists()).toBe(true)
    })

    it('应渲染导航按钮（上一个/下一个）', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const buttons = wrapper.findAll('button.search-btn')
      const titles = buttons.map((b) => b.attributes('title'))

      const hasPrev = titles.some((t) => t?.includes('上一个'))
      const hasNext = titles.some((t) => t?.includes('下一个'))

      expect(hasPrev).toBe(true)
      expect(hasNext).toBe(true)
    })

    it('应渲染关闭按钮', async () => {
      wrapper = mountDialog(true)
      await nextTick()
      const closeBtn = wrapper.find('button.search-btn-close')
      expect(closeBtn.exists()).toBe(true)
    })

    it('应渲染内容模式切换按钮', async () => {
      wrapper = mountDialog(true)
      await nextTick()
      const toggleBtns = wrapper.findAll('button.search-btn-toggle')
      expect(toggleBtns.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('交互', () => {
    it('输入文本时应触发 search 事件（防抖后）', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const input = wrapper.find('input.search-input')
      await input.setValue('测试关键词')

      // 等待防抖
      await new Promise((resolve) => setTimeout(resolve, 200))
      await nextTick()

      const searchEvents = wrapper.emitted('search')
      expect(searchEvents).toBeTruthy()
      expect(searchEvents!.length).toBeGreaterThanOrEqual(1)
      expect(searchEvents![0][0]).toBe('测试关键词')
    })

    it('点击下一个按钮应触发 next 事件', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      // 先设置搜索词以启用导航按钮
      const input = wrapper.find('input.search-input')
      await input.setValue('test')
      await new Promise((resolve) => setTimeout(resolve, 200))
      await nextTick()

      // 模拟有搜索结果
      wrapper.vm.updateResults(0, 3)
      await nextTick()

      const buttons = wrapper.findAll('button.search-btn')
      const nextBtn = buttons.find((b) => b.attributes('title')?.includes('下一个'))
      expect(nextBtn).toBeTruthy()
      await nextBtn!.trigger('click')

      expect(wrapper.emitted('next')).toBeTruthy()
    })

    it('点击上一个按钮应触发 prev 事件', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      // 先设置搜索词以启用导航按钮
      const input = wrapper.find('input.search-input')
      await input.setValue('test')
      await new Promise((resolve) => setTimeout(resolve, 200))
      await nextTick()

      // 模拟有搜索结果
      wrapper.vm.updateResults(0, 3)
      await nextTick()

      const buttons = wrapper.findAll('button.search-btn')
      const prevBtn = buttons.find((b) => b.attributes('title')?.includes('上一个'))
      expect(prevBtn).toBeTruthy()
      await prevBtn!.trigger('click')

      expect(wrapper.emitted('prev')).toBeTruthy()
    })

    it('点击关闭按钮应触发 close 和 update:visible 事件', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const closeBtn = wrapper.find('button.search-btn-close')
      await closeBtn.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
      const visibleEvents = wrapper.emitted('update:visible')
      expect(visibleEvents).toBeTruthy()
      expect(visibleEvents![visibleEvents!.length - 1][0]).toBe(false)
    })

    it('按 Escape 键应关闭弹窗', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const input = wrapper.find('input.search-input')
      await input.trigger('keydown', { key: 'Escape' })

      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('按 Enter 键应触发 next 事件', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const input = wrapper.find('input.search-input')
      await input.setValue('test')
      await new Promise((resolve) => setTimeout(resolve, 200))
      await nextTick()
      await input.trigger('keydown', { key: 'Enter', shiftKey: false })

      // Enter 在有搜索词时会先搜索再触发 next
      const nextEvents = wrapper.emitted('next')
      expect(nextEvents).toBeTruthy()
    })

    it('按 Shift+Enter 应触发 prev 事件', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const input = wrapper.find('input.search-input')
      await input.setValue('test')
      await new Promise((resolve) => setTimeout(resolve, 200))
      await nextTick()
      await input.trigger('keydown', { key: 'Enter', shiftKey: true })

      expect(wrapper.emitted('prev')).toBeTruthy()
    })
  })

  describe('搜索选项切换', () => {
    it('点击 "Ab 文本" 按钮应切换仅文本内容模式', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const toggleBtns = wrapper.findAll('button.search-btn-toggle')
      const contentBtn = toggleBtns.find((b) => b.text().includes('文本'))

      if (contentBtn) {
        // 默认 contentOnly 为 true，按钮应处于 active 状态
        expect(contentBtn.classes()).toContain('search-btn-active')
        await contentBtn.trigger('click')
        await nextTick()
        // 切换后不再 active
        expect(contentBtn.classes()).not.toContain('search-btn-active')
      }
    })

    it('点击 "Aa" 按钮应切换大小写敏感', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const toggleBtns = wrapper.findAll('button.search-btn-toggle')
      const caseBtn = toggleBtns.find((b) => b.text().includes('Aa'))

      if (caseBtn) {
        // 默认不区分大小写，按钮不应 active
        expect(caseBtn.classes()).not.toContain('search-btn-active')
        await caseBtn.trigger('click')
        await nextTick()
        expect(caseBtn.classes()).toContain('search-btn-active')
      }
    })
  })

  describe('状态显示', () => {
    it('无搜索词时应显示帮助提示文本', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      // 初始状态应显示帮助文本
      expect(wrapper.text()).toContain('Enter')
    })

    it('无匹配时应显示 "未找到" 消息', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      // 模拟搜索
      const input = wrapper.find('input.search-input')
      await input.setValue('不存在的搜索词')
      await new Promise((resolve) => setTimeout(resolve, 200))
      await nextTick()

      // updateResults(-1, 0) 表示无匹配
      wrapper.vm.updateResults(-1, 0)
      await nextTick()

      const text = wrapper.text()
      expect(text).toContain('未找到')
    })

    it('有匹配时应显示正确的计数格式', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      // 需要先输入搜索词，计数器才会显示
      const input = wrapper.find('input.search-input')
      await input.setValue('test')
      await new Promise((resolve) => setTimeout(resolve, 200))
      await nextTick()

      // 模拟有搜索结果（索引2，共5个）
      wrapper.vm.updateResults(2, 5)
      await nextTick()

      const text = wrapper.text()
      expect(text).toContain('3/5')
    })
  })

  describe('visible 变化时重置', () => {
    it('visible 变为 true 时应清空输入', async () => {
      wrapper = mountDialog(false)
      await nextTick()

      await wrapper.setProps({ visible: true })
      await nextTick()

      const input = wrapper.find('input.search-input')
      const inputEl = input.element as HTMLInputElement
      expect(inputEl.value).toBe('')
    })
  })

  describe('expose API', () => {
    it('updateResults 应更新内部计数', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      // 需要先输入搜索词，计数器才会显示
      const input = wrapper.find('input.search-input')
      await input.setValue('test')
      await new Promise((resolve) => setTimeout(resolve, 200))
      await nextTick()

      wrapper.vm.updateResults(0, 10)
      await nextTick()

      const text = wrapper.text()
      expect(text).toContain('1/10')
    })

    it('focus 应聚焦输入框', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      wrapper.vm.focus()
      await nextTick()

      const input = wrapper.find('input.search-input')
      expect(input.element).toBe(document.activeElement)
    })
  })

  describe('无障碍', () => {
    it('弹窗应有 role="dialog"', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.exists()).toBe(true)
    })

    it('按钮在无匹配时应禁用导航', async () => {
      wrapper = mountDialog(true)
      await nextTick()

      const buttons = wrapper.findAll('button.search-btn')
      const prevBtn = buttons.find((b) => b.attributes('title')?.includes('上一个'))
      const nextBtn = buttons.find((b) => b.attributes('title')?.includes('下一个'))

      // 无搜索词 + 无匹配时，导航按钮应被禁用
      expect(prevBtn?.attributes('disabled')).toBeDefined()
      expect(nextBtn?.attributes('disabled')).toBeDefined()
    })
  })
})
